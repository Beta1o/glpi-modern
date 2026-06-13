import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, isAbsolute, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createLegacyGlpiStore } from "./legacy-glpi-store.ts";
import {
  renderCentralPage,
  renderComputerListPage,
  renderLoginPage,
  renderTicketFormPage,
  renderTicketListPage,
  renderUserListPage
} from "./pages.ts";

const host = process.env.HOST || "127.0.0.1";
const port = Number.parseInt(process.env.PORT || "8090", 10);
const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
const maxBodyBytes = 64 * 1024;
const store = await createLegacyGlpiStore();

const securityHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self'"
  ].join("; "),
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
};

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"]
]);

const server = createServer(async (request, response) => {
  setBaseHeaders(response);

  try {
    await route(request, response);
  } catch (error) {
    sendError(request, response, error);
  }
});

server.listen(port, host, () => {
  console.log(`GLPI Modern listening on http://${host}:${port}/`);
});

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

async function route(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const method = request.method || "GET";
  const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);

  if ((url.pathname === "/" || url.pathname === "/index.html") && method === "GET") {
    return sendHtml(request, response, 200, renderLoginPage());
  }

  if (url.pathname === "/front/login.php" && method === "POST") {
    const form = await readForm(request);
    const login = String(form.get("login_name") || "").trim();
    const users = await store.listUsers();
    if (!users.some((user) => user.login === login)) {
      return sendHtml(request, response, 403, renderLoginPage("Invalid login"));
    }

    response.setHeader("Set-Cookie", "glpi_modern_session=1; Path=/; HttpOnly; SameSite=Lax");
    return redirect(response, String(form.get("redirect") || "/front/central.php") || "/front/central.php");
  }

  if (url.pathname === "/front/logout.php") {
    response.setHeader("Set-Cookie", "glpi_modern_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
    return redirect(response, "/");
  }

  if (url.pathname === "/healthz") {
    return sendJson(request, response, 200, { status: "ok" });
  }

  if (url.pathname === "/readyz") {
    await store.ping();
    return sendJson(request, response, 200, { status: "ready" });
  }

  if (url.pathname === "/api/v1/metrics" && method === "GET") {
    return sendJson(request, response, 200, await store.metrics());
  }

  if (url.pathname === "/api/v1/assets" && method === "GET") {
    return sendJson(request, response, 200, { data: await store.listAssets() });
  }

  if (url.pathname === "/api/v1/users" && method === "GET") {
    return sendJson(request, response, 200, { data: await store.listUsers() });
  }

  if (url.pathname === "/api/v1/tickets" && method === "GET") {
    return sendJson(request, response, 200, { data: await store.listTickets() });
  }

  if (url.pathname === "/api/v1/tickets" && method === "POST") {
    const input = await readJson(request);
    const ticket = await store.createTicket(input);
    return sendJson(request, response, 201, { data: ticket });
  }

  const ticketMatch = url.pathname.match(/^\/api\/v1\/tickets\/(\d+)$/);
  if (ticketMatch && (method === "PATCH" || method === "PUT")) {
    const input = await readJson(request);
    const ticket = await store.updateTicket(Number(ticketMatch[1]), input);
    return sendJson(request, response, 200, { data: ticket });
  }

  if (ticketMatch && method === "DELETE") {
    if (url.searchParams.get("purge") === "1") {
      await store.purgeTicket(Number(ticketMatch[1]));
      return sendJson(request, response, 200, { data: { purged: true } });
    }

    await store.deleteTicket(Number(ticketMatch[1]));
    return sendJson(request, response, 200, { data: { deleted: true } });
  }

  const ticketRestoreMatch = url.pathname.match(/^\/api\/v1\/tickets\/(\d+)\/restore$/);
  if (ticketRestoreMatch && method === "POST") {
    const ticket = await store.restoreTicket(Number(ticketRestoreMatch[1]));
    return sendJson(request, response, 200, { data: ticket });
  }

  if (url.pathname.startsWith("/api/")) {
    throw httpError(404, "NOT_FOUND", "API route not found");
  }

  if (isLegacyPageRoute(url.pathname)) {
    if (!isLoggedIn(request)) {
      return redirect(response, `/?redirect=${encodeURIComponent(url.pathname + url.search)}`);
    }

    return serveLegacyPage(request, response, url);
  }

  if (method !== "GET" && method !== "HEAD") {
    throw httpError(405, "METHOD_NOT_ALLOWED", "Method not allowed");
  }

  return serveStatic(request, response, url.pathname);
}

async function serveLegacyPage(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL
): Promise<void> {
  if (url.pathname === "/front/central.php") {
    return sendHtml(request, response, 200, renderCentralPage(await store.metrics()));
  }

  if (url.pathname === "/front/ticket.php") {
    return sendHtml(request, response, 200, renderTicketListPage(await store.listTickets()));
  }

  if (url.pathname === "/front/ticket.form.php") {
    if (request.method === "POST") {
      await handleTicketForm(url, request, response);
      return;
    }

    const id = Number.parseInt(url.searchParams.get("id") || "", 10);
    const ticket = Number.isInteger(id) && id > 0 ? await store.getTicket(id) : null;
    return sendHtml(request, response, 200, renderTicketFormPage(ticket, await store.listUsers()));
  }

  if (url.pathname === "/front/computer.php") {
    return sendHtml(request, response, 200, renderComputerListPage(await store.listAssets()));
  }

  if (url.pathname === "/front/user.php") {
    return sendHtml(request, response, 200, renderUserListPage(await store.listUsers()));
  }

  throw httpError(404, "NOT_FOUND", "Page not found");
}

async function handleTicketForm(
  url: URL,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const form = await readForm(request);
  const id = Number.parseInt(url.searchParams.get("id") || "", 10);
  const action = String(form.get("_action") || "");

  if (Number.isInteger(id) && id > 0) {
    if (action === "delete") {
      await store.deleteTicket(id);
      return redirect(response, "/front/ticket.php");
    }
    if (action === "restore") {
      await store.restoreTicket(id);
      return redirect(response, `/front/ticket.form.php?id=${id}`);
    }
    if (action === "purge") {
      await store.purgeTicket(id);
      return redirect(response, "/front/ticket.php");
    }

    await store.updateTicket(id, formToObject(form));
    return redirect(response, `/front/ticket.form.php?id=${id}`);
  }

  const ticket = await store.createTicket(formToObject(form));
  return redirect(response, `/front/ticket.form.php?id=${ticket.legacyId}`);
}

function isLegacyPageRoute(pathname: string): boolean {
  return [
    "/front/central.php",
    "/front/ticket.php",
    "/front/ticket.form.php",
    "/front/computer.php",
    "/front/user.php"
  ].includes(pathname);
}

function setBaseHeaders(response: ServerResponse): void {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.setHeader(key, value);
  }
  response.setHeader("Server", "glpi-modern");
}

function redirect(response: ServerResponse, location: string): void {
  response.writeHead(302, { Location: location });
  response.end();
}

async function serveStatic(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string
): Promise<void> {
  const filePath = resolveStaticPath(publicDir, pathname);
  if (!filePath) {
    throw httpError(404, "NOT_FOUND", "File not found");
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Cache-Control": "public, max-age=300",
      "Content-Length": body.byteLength,
      "Content-Type": mimeTypes.get(extname(filePath)) || "application/octet-stream"
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    response.end(body);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw httpError(404, "NOT_FOUND", "File not found");
    }
    throw error;
  }
}

function resolveStaticPath(rootDir: string, pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const requestPath = decoded === "/" ? "/index.html" : decoded;
  const normalized = normalize(requestPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const fullPath = join(rootDir, normalized);
  const diff = relative(rootDir, fullPath);

  if (diff.startsWith("..") || isAbsolute(diff)) {
    return null;
  }

  return fullPath;
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const contentType = request.headers["content-type"] || "";
  if (!contentType.toString().startsWith("application/json")) {
    throw httpError(415, "UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json");
  }

  const chunks: Buffer[] = [];
  let received = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    received += buffer.byteLength;
    if (received > maxBodyBytes) {
      throw httpError(413, "PAYLOAD_TOO_LARGE", "Request body is too large");
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Expected JSON object");
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw httpError(400, "BAD_JSON", "Request body must be a valid JSON object");
  }
}

async function readForm(request: IncomingMessage): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  let received = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    received += buffer.byteLength;
    if (received > maxBodyBytes) {
      throw httpError(413, "PAYLOAD_TOO_LARGE", "Request body is too large");
    }
    chunks.push(buffer);
  }

  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

function formToObject(form: URLSearchParams): Record<string, string> {
  return Object.fromEntries(form.entries());
}

function sendJson(
  request: IncomingMessage,
  response: ServerResponse,
  statusCode: number,
  payload: unknown
): void {
  const body = Buffer.from(JSON.stringify(payload));
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": body.byteLength,
    "Content-Type": "application/json; charset=utf-8"
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  response.end(body);
}

function sendHtml(
  request: IncomingMessage,
  response: ServerResponse,
  statusCode: number,
  html: string
): void {
  const body = Buffer.from(html);
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": body.byteLength,
    "Content-Type": "text/html; charset=utf-8"
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  response.end(body);
}

function sendError(request: IncomingMessage, response: ServerResponse, error: unknown): void {
  const statusCode = getStatusCode(error);
  const code = getErrorCode(error, statusCode);
  const message = error instanceof Error ? error.message : "Unexpected server error";
  sendJson(request, response, statusCode, {
    error: {
      code,
      message: statusCode >= 500 ? "Unexpected server error" : message
    }
  });

  if (statusCode >= 500) {
    console.error(error);
  }
}

function httpError(statusCode: number, code: string, message: string): Error & {
  statusCode: number;
  code: string;
} {
  const error = new Error(message) as Error & { statusCode: number; code: string };
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function getStatusCode(error: unknown): number {
  if (typeof error === "object" && error !== null && "statusCode" in error) {
    const statusCode = Number((error as { statusCode: unknown }).statusCode);
    if (Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 599) {
      return statusCode;
    }
  }

  return 500;
}

function getErrorCode(error: unknown, statusCode: number): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code: unknown }).code);
  }

  return statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR";
}

function isLoggedIn(request: IncomingMessage): boolean {
  return (request.headers.cookie || "").split(";").some((cookie) => cookie.trim() === "glpi_modern_session=1");
}

function shutdown(): void {
  server.close(async () => {
    await store.close();
    process.exit(0);
  });
}
