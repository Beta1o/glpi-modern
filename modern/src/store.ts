export type Asset = {
  id: string;
  legacyId: number;
  itemType: "Computer" | "NetworkEquipment" | "Printer";
  tag: string;
  name: string;
  owner: string;
  statusKey: string;
  statusLabel: string;
  site: string;
  updatedAt: string | null;
};

export type Ticket = {
  id: string;
  legacyId: number;
  number: string;
  title: string;
  contentText: string;
  requester: string;
  assignee: string;
  priorityValue: number;
  priorityKey: string;
  priorityLabel: string;
  statusValue: number;
  statusKey: string;
  statusLabel: string;
  typeValue: number;
  typeLabel: string;
  category: string;
  assetId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type GlpiUser = {
  id: number;
  login: string;
  displayName: string;
};

export type Metrics = {
  assets: number;
  onlineAssets: number;
  openTickets: number;
  urgentTickets: number;
  users: number;
  source: "legacy-glpi";
};

export type NewTicketInput = {
  title?: unknown;
  content?: unknown;
  requesterId?: unknown;
  priority?: unknown;
  urgency?: unknown;
  impact?: unknown;
  type?: unknown;
  assetId?: unknown;
};

export type UpdateTicketInput = {
  title?: unknown;
  content?: unknown;
  priority?: unknown;
  urgency?: unknown;
  impact?: unknown;
  status?: unknown;
  type?: unknown;
};

export type NormalizedTicketInput = {
  title: string;
  content: string;
  requesterId: number;
  priority: number;
  urgency: number;
  impact: number;
  type: number;
  asset: ParsedAssetId | null;
};

export type NormalizedTicketPatch = {
  title?: string;
  content?: string;
  priority?: number;
  urgency?: number;
  impact?: number;
  status?: number;
  type?: number;
};

export type ParsedAssetId = {
  itemType: "Computer" | "NetworkEquipment" | "Printer";
  legacyId: number;
};

export type Store = {
  listAssets(): Promise<Asset[]>;
  listTickets(): Promise<Ticket[]>;
  listUsers(): Promise<GlpiUser[]>;
  createTicket(input: NewTicketInput): Promise<Ticket>;
  updateTicket(id: number, input: UpdateTicketInput): Promise<Ticket>;
  deleteTicket(id: number): Promise<void>;
  restoreTicket(id: number): Promise<Ticket>;
  purgeTicket(id: number): Promise<void>;
  metrics(): Promise<Metrics>;
  ping(): Promise<void>;
  close(): Promise<void>;
};

const statusMap = new Map([
  [1, ["new", "New"]],
  [2, ["assigned", "Assigned"]],
  [3, ["planned", "Planned"]],
  [4, ["waiting", "Waiting"]],
  [5, ["solved", "Solved"]],
  [6, ["closed", "Closed"]]
] as const);

const priorityMap = new Map([
  [1, ["very-low", "Very low"]],
  [2, ["low", "Low"]],
  [3, ["medium", "Medium"]],
  [4, ["high", "High"]],
  [5, ["very-high", "Very high"]],
  [6, ["major", "Major"]]
] as const);

const typeMap = new Map([
  [1, "Incident"],
  [2, "Request"]
] as const);

export function mapGlpiStatus(value: unknown): Pick<Ticket, "statusValue" | "statusKey" | "statusLabel"> {
  const statusValue = normalizeScale(value, 1, 6, 1);
  const [statusKey, statusLabel] = statusMap.get(statusValue) || ["unknown", "Unknown"];
  return { statusValue, statusKey, statusLabel };
}

export function mapGlpiPriority(value: unknown): Pick<Ticket, "priorityValue" | "priorityKey" | "priorityLabel"> {
  const priorityValue = normalizeScale(value, 1, 6, 3);
  const [priorityKey, priorityLabel] = priorityMap.get(priorityValue) || ["medium", "Medium"];
  return { priorityValue, priorityKey, priorityLabel };
}

export function mapGlpiTicketType(value: unknown): Pick<Ticket, "typeValue" | "typeLabel"> {
  const typeValue = normalizeScale(value, 1, 2, 1);
  return { typeValue, typeLabel: typeMap.get(typeValue) || "Incident" };
}

export function normalizeTicketInput(input: NewTicketInput): NormalizedTicketInput {
  return {
    title: requireText(input.title, "title", 4, 160),
    content: optionalText(input.content, 0, 65_000),
    requesterId: requirePositiveInteger(input.requesterId, "requesterId"),
    priority: normalizeScale(input.priority, 1, 6, 3),
    urgency: normalizeScale(input.urgency, 1, 5, normalizeScale(input.priority, 1, 5, 3)),
    impact: normalizeScale(input.impact, 1, 5, normalizeScale(input.priority, 1, 5, 3)),
    type: normalizeScale(input.type, 1, 2, 1),
    asset: parseAssetId(input.assetId)
  };
}

export function normalizeTicketPatch(input: UpdateTicketInput): NormalizedTicketPatch {
  const patch: NormalizedTicketPatch = {};

  if (input.title !== undefined) {
    patch.title = requireText(input.title, "title", 4, 160);
  }

  if (input.content !== undefined) {
    patch.content = optionalText(input.content, 0, 65_000);
  }

  if (input.priority !== undefined) {
    patch.priority = normalizeScale(input.priority, 1, 6, 3);
  }

  if (input.urgency !== undefined) {
    patch.urgency = normalizeScale(input.urgency, 1, 5, 3);
  }

  if (input.impact !== undefined) {
    patch.impact = normalizeScale(input.impact, 1, 5, 3);
  }

  if (input.status !== undefined) {
    patch.status = normalizeScale(input.status, 1, 6, 1);
  }

  if (input.type !== undefined) {
    patch.type = normalizeScale(input.type, 1, 2, 1);
  }

  return patch;
}

export function parseAssetId(value: unknown): ParsedAssetId | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const [itemType, rawId] = value.trim().split(":");
  if (!["Computer", "NetworkEquipment", "Printer"].includes(itemType)) {
    throw validationError("assetId item type is not supported");
  }

  const legacyId = Number.parseInt(rawId || "", 10);
  if (!Number.isInteger(legacyId) || legacyId <= 0) {
    throw validationError("assetId must include a positive legacy id");
  }

  return { itemType: itemType as ParsedAssetId["itemType"], legacyId };
}

export function stripHtml(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export function displayName(parts: {
  firstname?: string | null;
  realname?: string | null;
  name?: string | null;
  fallback?: string | null;
}): string {
  const fullName = [parts.firstname, parts.realname]
    .map((part) => (part || "").trim())
    .filter(Boolean)
    .join(" ");

  return fullName || parts.name?.trim() || parts.fallback?.trim() || "Unassigned";
}

export function validationError(message: string): Error & { statusCode: number; code: string } {
  const error = new Error(message) as Error & { statusCode: number; code: string };
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
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

function optionalText(value: unknown, min: number, max: number): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value !== "string") {
    throw validationError("content must be text");
  }

  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw validationError(`content must be ${min}-${max} characters`);
  }

  return normalized;
}

function requirePositiveInteger(value: unknown, field: string): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value || ""), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw validationError(`${field} must be a positive integer`);
  }

  return parsed;
}

function normalizeScale(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value || ""), 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return fallback;
  }

  return parsed;
}
