import mysql, {
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket
} from "mysql2/promise";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  type Asset,
  type GlpiUser,
  type Metrics,
  type NewTicketInput,
  type Store,
  type UpdateTicketInput,
  displayName,
  mapGlpiPriority,
  mapGlpiStatus,
  mapGlpiTicketType,
  normalizeTicketPatch,
  normalizeTicketInput,
  stripHtml,
  validationError
} from "./store.ts";

type LegacyConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

type TicketRow = RowDataPacket & {
  id: number;
  name: string | null;
  content: string | null;
  requester: string | null;
  assignee: string | null;
  status: number;
  priority: number;
  type: number;
  category: string | null;
  asset_id: string | null;
  date_creation: Date | string | null;
  date_mod: Date | string | null;
};

type AssetRow = RowDataPacket & {
  legacy_id: number;
  item_type: Asset["itemType"];
  name: string | null;
  tag: string | null;
  owner: string | null;
  state: string | null;
  site: string | null;
  date_mod: Date | string | null;
};

type UserRow = RowDataPacket & {
  id: number;
  name: string | null;
  realname: string | null;
  firstname: string | null;
};

export async function createLegacyGlpiStore(): Promise<Store> {
  const config = await loadLegacyConfig();
  const pool = mysql.createPool({
    charset: "utf8mb4",
    connectionLimit: 10,
    database: config.database,
    host: config.host,
    password: config.password,
    port: config.port,
    timezone: "Z",
    user: config.user
  });

  return new LegacyGlpiStore(pool);
}

class LegacyGlpiStore implements Store {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async listAssets(): Promise<Asset[]> {
    const [rows] = await this.pool.query<AssetRow[]>(assetQuery);
    return rows.map(mapAssetRow);
  }

  async listTickets(): Promise<ReturnType<typeof mapTicketRow>[]> {
    const [rows] = await this.pool.query<TicketRow[]>(
      `${ticketQuery} AND t.is_deleted = 0 ORDER BY t.id DESC LIMIT 200`
    );
    return rows.map(mapTicketRow);
  }

  async getTicket(id: number): Promise<ReturnType<typeof mapTicketRow>> {
    return await this.getTicketRow(normalizeLegacyId(id), this.pool);
  }

  async listUsers(): Promise<GlpiUser[]> {
    const [rows] = await this.pool.query<UserRow[]>(
      `SELECT id, name, realname, firstname
         FROM glpi_users
        WHERE is_active = 1 AND is_deleted = 0
        ORDER BY name
        LIMIT 200`
    );

    return rows.map((row) => ({
      id: row.id,
      login: row.name || `user-${row.id}`,
      displayName: displayName({
        firstname: row.firstname,
        realname: row.realname,
        name: row.name,
        fallback: `User ${row.id}`
      })
    }));
  }

  async createTicket(input: NewTicketInput): Promise<ReturnType<typeof mapTicketRow>> {
    const ticket = normalizeTicketInput(input);
    await this.assertUserExists(ticket.requesterId);
    if (ticket.asset) {
      await this.assertAssetExists(ticket.asset.itemType, ticket.asset.legacyId);
    }

    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO glpi_tickets (
           entities_id, name, date, date_creation, date_mod, status,
           users_id_recipient, content, urgency, impact, priority, type
         ) VALUES (
           0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1,
           ?, ?, ?, ?, ?, ?
         )`,
        [
          ticket.title,
          ticket.requesterId,
          ticket.content,
          ticket.urgency,
          ticket.impact,
          ticket.priority,
          ticket.type
        ]
      );

      const ticketId = result.insertId;
      await connection.execute(
        `INSERT INTO glpi_tickets_users (tickets_id, users_id, type, use_notification)
         VALUES (?, ?, 1, 1)`,
        [ticketId, ticket.requesterId]
      );

      if (ticket.asset) {
        await connection.execute(
          `INSERT INTO glpi_items_tickets (itemtype, items_id, tickets_id)
           VALUES (?, ?, ?)`,
          [ticket.asset.itemType, ticket.asset.legacyId, ticketId]
        );
      }

      await connection.commit();
      return await this.getTicketRow(ticketId, connection);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateTicket(id: number, input: UpdateTicketInput): Promise<ReturnType<typeof mapTicketRow>> {
    const ticketId = normalizeLegacyId(id);
    const patch = normalizeTicketPatch(input);
    const assignments: string[] = [];
    const values: Array<number | string> = [];

    if (patch.title !== undefined) {
      assignments.push("name = ?");
      values.push(patch.title);
    }
    if (patch.content !== undefined) {
      assignments.push("content = ?");
      values.push(patch.content);
    }
    if (patch.priority !== undefined) {
      assignments.push("priority = ?");
      values.push(patch.priority);
    }
    if (patch.urgency !== undefined) {
      assignments.push("urgency = ?");
      values.push(patch.urgency);
    }
    if (patch.impact !== undefined) {
      assignments.push("impact = ?");
      values.push(patch.impact);
    }
    if (patch.status !== undefined) {
      assignments.push("status = ?");
      values.push(patch.status);
    }
    if (patch.type !== undefined) {
      assignments.push("type = ?");
      values.push(patch.type);
    }

    if (assignments.length > 0) {
      values.push(ticketId);
      await this.pool.execute(
        `UPDATE glpi_tickets
            SET ${assignments.join(", ")}, date_mod = CURRENT_TIMESTAMP
          WHERE id = ? AND is_deleted = 0`,
        values
      );
    }

    return await this.getTicketRow(ticketId, this.pool);
  }

  async deleteTicket(id: number): Promise<void> {
    const ticketId = normalizeLegacyId(id);
    await this.pool.execute(
      `UPDATE glpi_tickets
          SET is_deleted = 1, date_mod = CURRENT_TIMESTAMP
        WHERE id = ?`,
      [ticketId]
    );
  }

  async restoreTicket(id: number): Promise<ReturnType<typeof mapTicketRow>> {
    const ticketId = normalizeLegacyId(id);
    await this.pool.execute(
      `UPDATE glpi_tickets
          SET is_deleted = 0, date_mod = CURRENT_TIMESTAMP
        WHERE id = ?`,
      [ticketId]
    );
    return await this.getTicketRow(ticketId, this.pool);
  }

  async purgeTicket(id: number): Promise<void> {
    const ticketId = normalizeLegacyId(id);
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const sql of ticketPurgeQueries) {
        const values = sql.includes("tickets_id_1") ? [ticketId, ticketId] : [ticketId];
        await connection.execute(sql, values);
      }
      await connection.execute("DELETE FROM glpi_tickets WHERE id = ?", [ticketId]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async metrics(): Promise<Metrics> {
    const [[ticketCounts], [assetCounts], [userCounts]] = await Promise.all([
      this.pool.query<RowDataPacket[]>(
        `SELECT
           COUNT(*) AS openTickets,
           SUM(priority >= 5 AND status NOT IN (5, 6)) AS urgentTickets
         FROM glpi_tickets
         WHERE is_deleted = 0 AND status NOT IN (5, 6)`
      ),
      this.pool.query<RowDataPacket[]>(
        `SELECT SUM(total) AS assets, SUM(online_total) AS onlineAssets
           FROM (
             SELECT COUNT(*) AS total, SUM(states_id = 0) AS online_total
             FROM glpi_computers WHERE is_deleted = 0 AND is_template = 0
             UNION ALL
             SELECT COUNT(*) AS total, SUM(states_id = 0) AS online_total
             FROM glpi_networkequipments WHERE is_deleted = 0 AND is_template = 0
             UNION ALL
             SELECT COUNT(*) AS total, SUM(states_id = 0) AS online_total
             FROM glpi_printers WHERE is_deleted = 0 AND is_template = 0
           ) asset_counts`
      ),
      this.pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS users FROM glpi_users WHERE is_active = 1 AND is_deleted = 0`
      )
    ]);

    return {
      assets: Number(assetCounts[0]?.assets || 0),
      onlineAssets: Number(assetCounts[0]?.onlineAssets || 0),
      openTickets: Number(ticketCounts[0]?.openTickets || 0),
      urgentTickets: Number(ticketCounts[0]?.urgentTickets || 0),
      users: Number(userCounts[0]?.users || 0),
      source: "legacy-glpi"
    };
  }

  async ping(): Promise<void> {
    await this.pool.query("SELECT 1");
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async getTicketRow(
    id: number,
    connection: Pool | PoolConnection
  ): Promise<ReturnType<typeof mapTicketRow>> {
    const [rows] = await connection.query<TicketRow[]>(`${ticketQuery} AND t.id = ?`, [id]);
    if (!rows[0]) {
      throw validationError("ticket was not created");
    }

    return mapTicketRow(rows[0]);
  }

  private async assertUserExists(id: number): Promise<void> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      "SELECT id FROM glpi_users WHERE id = ? AND is_active = 1 AND is_deleted = 0",
      [id]
    );
    if (!rows[0]) {
      throw validationError("requesterId does not exist in GLPI");
    }
  }

  private async assertAssetExists(itemType: string, legacyId: number): Promise<void> {
    const table = assetTableFor(itemType);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id FROM ${table} WHERE id = ? AND is_deleted = 0 AND is_template = 0`,
      [legacyId]
    );
    if (!rows[0]) {
      throw validationError("assetId does not exist in GLPI");
    }
  }
}

function normalizeLegacyId(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value || ""), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw validationError("legacy id must be a positive integer");
  }

  return parsed;
}

async function loadLegacyConfig(): Promise<LegacyConfig> {
  if (process.env.GLPI_LEGACY_DATABASE_URL) {
    return parseDatabaseUrl(process.env.GLPI_LEGACY_DATABASE_URL);
  }

  const host = process.env.GLPI_DB_HOST;
  const user = process.env.GLPI_DB_USER;
  const database = process.env.GLPI_DB_NAME;
  if (host && user && database) {
    return splitHostPort({
      database,
      host,
      password: process.env.GLPI_DB_PASSWORD || "",
      user
    });
  }

  const configPath = fileURLToPath(new URL("../../config/config_db.php", import.meta.url));
  const phpConfig = await readFile(configPath, "utf8");

  return splitHostPort({
    database: readPhpProperty(phpConfig, "dbdefault"),
    host: readPhpProperty(phpConfig, "dbhost"),
    password: readPhpProperty(phpConfig, "dbpassword"),
    user: readPhpProperty(phpConfig, "dbuser")
  });
}

function parseDatabaseUrl(value: string): LegacyConfig {
  const url = new URL(value);
  return {
    database: url.pathname.replace(/^\//, ""),
    host: url.hostname,
    password: decodeURIComponent(url.password),
    port: Number.parseInt(url.port || "3306", 10),
    user: decodeURIComponent(url.username)
  };
}

function splitHostPort(config: Omit<LegacyConfig, "port">): LegacyConfig {
  const [host, rawPort] = config.host.split(":");
  return {
    ...config,
    host: host || "127.0.0.1",
    port: Number.parseInt(rawPort || "3306", 10)
  };
}

function readPhpProperty(source: string, property: string): string {
  const match = source.match(new RegExp(`\\$${property}\\s*=\\s*'([^']*)'`));
  if (!match) {
    throw new Error(`Missing ${property} in GLPI config_db.php`);
  }

  return match[1];
}

function mapTicketRow(row: TicketRow) {
  const status = mapGlpiStatus(row.status);
  const priority = mapGlpiPriority(row.priority);
  const type = mapGlpiTicketType(row.type);

  return {
    id: `Ticket:${row.id}`,
    legacyId: row.id,
    number: `#${row.id}`,
    title: row.name || `Ticket ${row.id}`,
    contentText: stripHtml(row.content),
    requester: row.requester || "Unassigned",
    assignee: row.assignee || "Unassigned",
    category: row.category || "Uncategorized",
    assetId: row.asset_id,
    createdAt: toIso(row.date_creation),
    updatedAt: toIso(row.date_mod),
    ...status,
    ...priority,
    ...type
  };
}

function mapAssetRow(row: AssetRow): Asset {
  const statusLabel = row.state || "Active";
  const statusKey = statusLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "active";

  return {
    id: `${row.item_type}:${row.legacy_id}`,
    legacyId: row.legacy_id,
    itemType: row.item_type,
    tag: row.tag || `${row.item_type}-${row.legacy_id}`,
    name: row.name || `${row.item_type} ${row.legacy_id}`,
    owner: row.owner || "Unassigned",
    statusKey,
    statusLabel,
    site: row.site || "No location",
    updatedAt: toIso(row.date_mod)
  };
}

function assetTableFor(itemType: string): string {
  switch (itemType) {
    case "Computer":
      return "glpi_computers";
    case "NetworkEquipment":
      return "glpi_networkequipments";
    case "Printer":
      return "glpi_printers";
    default:
      throw validationError("assetId item type is not supported");
  }
}

function toIso(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

const actorRequesterQuery = `
  SELECT
    tu.tickets_id,
    GROUP_CONCAT(
      COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.firstname, ''), ' ', COALESCE(u.realname, ''))), ''), u.name, tu.alternative_email)
      ORDER BY u.name SEPARATOR ', '
    ) AS requester
  FROM glpi_tickets_users tu
  LEFT JOIN glpi_users u ON u.id = tu.users_id
  WHERE tu.type = 1
  GROUP BY tu.tickets_id
`;

const actorAssigneeQuery = `
  SELECT
    tu.tickets_id,
    GROUP_CONCAT(
      COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.firstname, ''), ' ', COALESCE(u.realname, ''))), ''), u.name)
      ORDER BY u.name SEPARATOR ', '
    ) AS assignee
  FROM glpi_tickets_users tu
  LEFT JOIN glpi_users u ON u.id = tu.users_id
  WHERE tu.type = 2
  GROUP BY tu.tickets_id
`;

const ticketAssetQuery = `
  SELECT
    tickets_id,
    MIN(CONCAT(itemtype, ':', items_id)) AS asset_id
  FROM glpi_items_tickets
  GROUP BY tickets_id
`;

const ticketPurgeQueries = [
  "DELETE FROM glpi_tickets_users WHERE tickets_id = ?",
  "DELETE FROM glpi_groups_tickets WHERE tickets_id = ?",
  "DELETE FROM glpi_suppliers_tickets WHERE tickets_id = ?",
  "DELETE FROM glpi_changes_tickets WHERE tickets_id = ?",
  "DELETE FROM glpi_problems_tickets WHERE tickets_id = ?",
  "DELETE FROM glpi_projecttasks_tickets WHERE tickets_id = ?",
  "DELETE FROM glpi_tickets_contracts WHERE tickets_id = ?",
  "DELETE FROM glpi_tickets_tickets WHERE tickets_id_1 = ? OR tickets_id_2 = ?",
  "DELETE FROM glpi_ticketsatisfactions WHERE tickets_id = ?",
  "DELETE FROM glpi_slalevels_tickets WHERE tickets_id = ?",
  "DELETE FROM glpi_olalevels_tickets WHERE tickets_id = ?",
  "DELETE FROM glpi_items_tickets WHERE tickets_id = ?"
];

const ticketQuery = `
  SELECT
    t.id,
    t.name,
    t.content,
    t.status,
    t.priority,
    t.type,
    t.date_creation,
    t.date_mod,
    COALESCE(req.requester, NULLIF(TRIM(CONCAT(COALESCE(ru.firstname, ''), ' ', COALESCE(ru.realname, ''))), ''), ru.name) AS requester,
    assignee.assignee,
    cat.completename AS category,
    linked.asset_id
  FROM glpi_tickets t
  LEFT JOIN glpi_users ru ON ru.id = t.users_id_recipient
  LEFT JOIN (${actorRequesterQuery}) req ON req.tickets_id = t.id
  LEFT JOIN (${actorAssigneeQuery}) assignee ON assignee.tickets_id = t.id
  LEFT JOIN (${ticketAssetQuery}) linked ON linked.tickets_id = t.id
  LEFT JOIN glpi_itilcategories cat ON cat.id = t.itilcategories_id
  WHERE 1 = 1
`;

const assetQuery = `
  SELECT * FROM (
    SELECT
      c.id AS legacy_id,
      'Computer' AS item_type,
      c.name,
      COALESCE(NULLIF(c.serial, ''), NULLIF(c.otherserial, ''), CONCAT('Computer-', c.id)) AS tag,
      COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.firstname, ''), ' ', COALESCE(u.realname, ''))), ''), u.name) AS owner,
      COALESCE(st.completename, st.name) AS state,
      COALESCE(loc.completename, loc.name) AS site,
      c.date_mod
    FROM glpi_computers c
    LEFT JOIN glpi_users u ON u.id = c.users_id
    LEFT JOIN glpi_states st ON st.id = c.states_id
    LEFT JOIN glpi_locations loc ON loc.id = c.locations_id
    WHERE c.is_deleted = 0 AND c.is_template = 0
    UNION ALL
    SELECT
      n.id AS legacy_id,
      'NetworkEquipment' AS item_type,
      n.name,
      COALESCE(NULLIF(n.serial, ''), NULLIF(n.otherserial, ''), CONCAT('NetworkEquipment-', n.id)) AS tag,
      COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.firstname, ''), ' ', COALESCE(u.realname, ''))), ''), u.name) AS owner,
      COALESCE(st.completename, st.name) AS state,
      COALESCE(loc.completename, loc.name) AS site,
      n.date_mod
    FROM glpi_networkequipments n
    LEFT JOIN glpi_users u ON u.id = n.users_id
    LEFT JOIN glpi_states st ON st.id = n.states_id
    LEFT JOIN glpi_locations loc ON loc.id = n.locations_id
    WHERE n.is_deleted = 0 AND n.is_template = 0
    UNION ALL
    SELECT
      p.id AS legacy_id,
      'Printer' AS item_type,
      p.name,
      COALESCE(NULLIF(p.serial, ''), NULLIF(p.otherserial, ''), CONCAT('Printer-', p.id)) AS tag,
      COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.firstname, ''), ' ', COALESCE(u.realname, ''))), ''), u.name) AS owner,
      COALESCE(st.completename, st.name) AS state,
      COALESCE(loc.completename, loc.name) AS site,
      p.date_mod
    FROM glpi_printers p
    LEFT JOIN glpi_users u ON u.id = p.users_id
    LEFT JOIN glpi_states st ON st.id = p.states_id
    LEFT JOIN glpi_locations loc ON loc.id = p.locations_id
    WHERE p.is_deleted = 0 AND p.is_template = 0
  ) assets
  ORDER BY item_type, name
  LIMIT 500
`;
