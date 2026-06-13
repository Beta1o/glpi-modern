import { randomUUID } from "node:crypto";

export type AssetStatus = "online" | "maintenance" | "retired";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketStatus = "open" | "assigned" | "resolved";

export type Asset = {
  id: string;
  tag: string;
  name: string;
  owner: string;
  status: AssetStatus;
  site: string;
  updatedAt: string;
};

export type Ticket = {
  id: string;
  number: string;
  title: string;
  requester: string;
  priority: TicketPriority;
  status: TicketStatus;
  assetId: string | null;
  createdAt: string;
};

export type NewTicketInput = {
  title?: unknown;
  requester?: unknown;
  priority?: unknown;
  assetId?: unknown;
};

const priorities: TicketPriority[] = ["low", "normal", "high", "urgent"];

const seedAssets: Asset[] = [
  {
    id: "ast-laptop-017",
    tag: "LTP-017",
    name: "Finance laptop",
    owner: "Finance",
    status: "online",
    site: "Riyadh HQ",
    updatedAt: new Date(Date.now() - 11 * 60_000).toISOString()
  },
  {
    id: "ast-router-002",
    tag: "NET-002",
    name: "Core router",
    owner: "Network",
    status: "maintenance",
    site: "Data room",
    updatedAt: new Date(Date.now() - 38 * 60_000).toISOString()
  },
  {
    id: "ast-printer-044",
    tag: "PRN-044",
    name: "Support printer",
    owner: "Support",
    status: "online",
    site: "Service desk",
    updatedAt: new Date(Date.now() - 74 * 60_000).toISOString()
  }
];

const seedTickets: Ticket[] = [
  {
    id: "tck-1001",
    number: "INC-1001",
    title: "VPN access fails for finance team",
    requester: "Amina",
    priority: "high",
    status: "assigned",
    assetId: "ast-laptop-017",
    createdAt: new Date(Date.now() - 28 * 60_000).toISOString()
  },
  {
    id: "tck-1002",
    number: "INC-1002",
    title: "Printer queue is blocked",
    requester: "Support floor",
    priority: "normal",
    status: "open",
    assetId: "ast-printer-044",
    createdAt: new Date(Date.now() - 52 * 60_000).toISOString()
  }
];

export function createStore() {
  const assets = new Map(seedAssets.map((asset) => [asset.id, asset]));
  const tickets = new Map(seedTickets.map((ticket) => [ticket.id, ticket]));

  return {
    listAssets(): Asset[] {
      return [...assets.values()].sort((left, right) => left.tag.localeCompare(right.tag));
    },

    listTickets(): Ticket[] {
      return [...tickets.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    },

    createTicket(input: NewTicketInput): Ticket {
      const title = requireText(input.title, "title", 4, 160);
      const requester = requireText(input.requester, "requester", 2, 80);
      const priority = normalizePriority(input.priority);
      const assetId = normalizeAssetId(input.assetId, assets);
      const nextNumber = `INC-${1000 + tickets.size + 1}`;
      const ticket: Ticket = {
        id: `tck-${randomUUID()}`,
        number: nextNumber,
        title,
        requester,
        priority,
        status: "open",
        assetId,
        createdAt: new Date().toISOString()
      };

      tickets.set(ticket.id, ticket);
      return ticket;
    },

    metrics() {
      const allAssets = [...assets.values()];
      const allTickets = [...tickets.values()];

      return {
        assets: allAssets.length,
        onlineAssets: allAssets.filter((asset) => asset.status === "online").length,
        openTickets: allTickets.filter((ticket) => ticket.status !== "resolved").length,
        urgentTickets: allTickets.filter((ticket) => ticket.priority === "urgent").length,
        meanAssignmentMinutes: 14
      };
    }
  };
}

function requireText(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== "string") {
    throw validationError(`${field} is required`);
  }

  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < min || normalized.length > max) {
    throw validationError(`${field} must be ${min}-${max} characters`);
  }

  return normalized;
}

function normalizePriority(value: unknown): TicketPriority {
  if (typeof value !== "string" || !priorities.includes(value as TicketPriority)) {
    return "normal";
  }

  return value as TicketPriority;
}

function normalizeAssetId(value: unknown, assets: Map<string, Asset>): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const normalized = value.trim();
  if (!assets.has(normalized)) {
    throw validationError("assetId does not exist");
  }

  return normalized;
}

function validationError(message: string): Error & { statusCode: number; code: string } {
  const error = new Error(message) as Error & { statusCode: number; code: string };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
}
