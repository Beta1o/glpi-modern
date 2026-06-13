import type { Asset, GlpiUser, Metrics, Ticket } from "./store.ts";

type ShellOptions = {
  active: "central" | "tickets" | "assets" | "users";
  body: string;
  title: string;
};

export function renderLoginPage(error = ""): string {
  return renderDocument({
    body: `
      <main id="page" class="page-anonymous" role="main" tabindex="-1">
        <div class="flex-fill d-flex flex-column justify-content-center py-4 mt-4">
          <div class="container-tight py-6 glpi-login-container">
            <div class="text-center">
              <span class="glpi-logo mb-4" title="GLPI"></span>
            </div>
            <div class="card card-md main-content-card">
              <div class="card-header"></div>
              <div class="card-body">
                ${error ? `<div class="alert alert-danger">${escapeHtml(error)}</div>` : ""}
                <form action="/front/login.php" method="post" autocomplete="off">
                  <input type="hidden" name="noAUTO" value="0">
                  <input type="hidden" name="redirect" value="">
                  <div class="row justify-content-center">
                    <div class="col-md-5">
                      <div class="card-header mb-4">
                        <h2 class="mx-auto">Login to your account</h2>
                      </div>
                      <div class="mb-3">
                        <label class="form-label" for="login_name">Login</label>
                        <input type="text" class="form-control" id="login_name" name="login_name" value="glpi">
                      </div>
                      <div class="mb-4">
                        <label class="form-label" for="login_password">Password</label>
                        <input type="password" class="form-control" id="login_password" name="login_password" autocomplete="off">
                      </div>
                      <div class="mb-3">
                        <label class="form-label" for="auth">Login source</label>
                        <select name="auth" id="auth" class="form-select">
                          <option value="local" selected>GLPI internal database</option>
                        </select>
                      </div>
                      <div class="mb-2">
                        <label class="form-check" for="login_remember">
                          <input type="checkbox" class="form-check-input" id="login_remember" name="login_remember" checked>
                          <span class="form-check-label">Remember me</span>
                        </label>
                      </div>
                      <div class="form-footer">
                        <button type="submit" name="submit" class="btn btn-primary w-100 mb-2">Sign in</button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div class="text-center text-muted mt-3">
              <a href="https://glpi-project.org/" class="copyright">GLPI Copyright (C) 2015-2026 Teclib' and contributors</a>
            </div>
          </div>
        </div>
      </main>
    `,
    title: "Authentication - GLPI"
  });
}

export function renderCentralPage(metrics: Metrics): string {
  return renderShell({
    active: "central",
    title: "Standard Interface - GLPI",
    body: `
      <div class="legacy-page-header">
        <h1>Dashboard</h1>
        <div class="text-muted">Standard Interface</div>
      </div>
      <div class="row g-3">
        ${metricCard("Tickets", metrics.openTickets)}
        ${metricCard("Assets", metrics.assets)}
        ${metricCard("Users", metrics.users)}
        ${metricCard("Very high / Major", metrics.urgentTickets)}
      </div>
      <div class="card mt-3">
        <div class="card-header">
          <h3 class="card-title">Central</h3>
        </div>
        <div class="card-body">
          <ul class="nav nav-tabs">
            <li class="nav-item"><a class="nav-link active" href="/front/central.php">Dashboard</a></li>
            <li class="nav-item"><a class="nav-link" href="/front/ticket.php">Tickets</a></li>
            <li class="nav-item"><a class="nav-link" href="/front/computer.php">Assets</a></li>
          </ul>
        </div>
      </div>
    `
  });
}

export function renderTicketListPage(tickets: Ticket[]): string {
  return renderShell({
    active: "tickets",
    title: "Tickets - GLPI",
    body: `
      <div class="legacy-page-header">
        <h1>Tickets</h1>
        <a class="btn btn-primary" href="/front/ticket.form.php">Create Ticket</a>
      </div>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Search results</h3>
        </div>
        <div class="table-responsive">
          <table class="table table-hover card-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Requester</th>
                <th>Assigned to</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Type</th>
                <th>Opening date</th>
              </tr>
            </thead>
            <tbody>
              ${tickets.map(renderTicketRow).join("") || `<tr><td colspan="8" class="text-muted">No item found</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `
  });
}

export function renderTicketFormPage(ticket: Ticket | null, users: GlpiUser[]): string {
  const isNew = ticket === null;
  const title = isNew ? "Create Ticket" : `Ticket - ${ticket.title} - ID ${ticket.legacyId} - GLPI`;
  return renderShell({
    active: "tickets",
    title,
    body: `
      <div class="legacy-page-header">
        <h1>${isNew ? "Create Ticket" : escapeHtml(ticket.title)}</h1>
        <a class="btn btn-outline-secondary" href="/front/ticket.php">Back to list</a>
      </div>
      <form class="card" action="/front/ticket.form.php${ticket ? `?id=${ticket.legacyId}` : ""}" method="post">
        <div class="card-header">
          <h3 class="card-title">Ticket</h3>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-8">
              <label class="form-label" for="ticket-title">Title</label>
              <input class="form-control" id="ticket-title" name="title" value="${escapeAttr(ticket?.title || "")}" required>
            </div>
            <div class="col-md-4">
              <label class="form-label" for="ticket-type">Type</label>
              <select class="form-select" id="ticket-type" name="type">
                ${option("1", "Incident", ticket?.typeValue || 1)}
                ${option("2", "Request", ticket?.typeValue || 1)}
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label" for="ticket-status">Status</label>
              <select class="form-select" id="ticket-status" name="status">
                ${option("1", "New", ticket?.statusValue || 1)}
                ${option("2", "Assigned", ticket?.statusValue || 1)}
                ${option("3", "Planned", ticket?.statusValue || 1)}
                ${option("4", "Waiting", ticket?.statusValue || 1)}
                ${option("5", "Solved", ticket?.statusValue || 1)}
                ${option("6", "Closed", ticket?.statusValue || 1)}
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label" for="ticket-priority">Priority</label>
              <select class="form-select" id="ticket-priority" name="priority">
                ${option("1", "Very low", ticket?.priorityValue || 3)}
                ${option("2", "Low", ticket?.priorityValue || 3)}
                ${option("3", "Medium", ticket?.priorityValue || 3)}
                ${option("4", "High", ticket?.priorityValue || 3)}
                ${option("5", "Very high", ticket?.priorityValue || 3)}
                ${option("6", "Major", ticket?.priorityValue || 3)}
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label" for="ticket-requester">Requester</label>
              <select class="form-select" id="ticket-requester" name="requesterId" ${isNew ? "required" : "disabled"}>
                ${users.map((user) => `<option value="${user.id}">${escapeHtml(user.displayName)} (${escapeHtml(user.login)})</option>`).join("")}
              </select>
            </div>
            <div class="col-12">
              <label class="form-label" for="ticket-content">Description</label>
              <textarea class="form-control" id="ticket-content" name="content" rows="8">${escapeHtml(ticket?.contentText || "")}</textarea>
            </div>
          </div>
        </div>
        <div class="card-footer d-flex gap-2">
          <button class="btn btn-primary" type="submit" name="_action" value="${isNew ? "create" : "update"}">${isNew ? "Add" : "Save"}</button>
          ${ticket ? `
            <button class="btn btn-outline-danger" type="submit" name="_action" value="delete">Put in trashbin</button>
            <button class="btn btn-outline-secondary" type="submit" name="_action" value="restore">Restore</button>
            <button class="btn btn-danger" type="submit" name="_action" value="purge">Delete permanently</button>
          ` : ""}
        </div>
      </form>
    `
  });
}

export function renderComputerListPage(assets: Asset[]): string {
  return renderShell({
    active: "assets",
    title: "Computers - GLPI",
    body: `
      <div class="legacy-page-header">
        <h1>Computers</h1>
      </div>
      <div class="card">
        <div class="table-responsive">
          <table class="table table-hover card-table">
            <thead>
              <tr><th>Name</th><th>Type</th><th>Serial number</th><th>User</th><th>Status</th><th>Location</th><th>Last update</th></tr>
            </thead>
            <tbody>
              ${assets.map((asset) => `
                <tr>
                  <td>${escapeHtml(asset.name)}</td>
                  <td>${escapeHtml(asset.itemType)}</td>
                  <td>${escapeHtml(asset.tag)}</td>
                  <td>${escapeHtml(asset.owner)}</td>
                  <td>${escapeHtml(asset.statusLabel)}</td>
                  <td>${escapeHtml(asset.site)}</td>
                  <td>${formatDate(asset.updatedAt)}</td>
                </tr>
              `).join("") || `<tr><td colspan="7" class="text-muted">No item found</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `
  });
}

export function renderUserListPage(users: GlpiUser[]): string {
  return renderShell({
    active: "users",
    title: "Users - GLPI",
    body: `
      <div class="legacy-page-header">
        <h1>Users</h1>
      </div>
      <div class="card">
        <div class="table-responsive">
          <table class="table table-hover card-table">
            <thead><tr><th>ID</th><th>Login</th><th>Name</th></tr></thead>
            <tbody>
              ${users.map((user) => `
                <tr>
                  <td>${user.id}</td>
                  <td>${escapeHtml(user.login)}</td>
                  <td>${escapeHtml(user.displayName)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `
  });
}

function renderShell(options: ShellOptions): string {
  const nav = [
    ["central", "/front/central.php", "Dashboard"],
    ["assets", "/front/computer.php", "Assets"],
    ["tickets", "/front/ticket.php", "Tickets"],
    ["users", "/front/user.php", "Users"]
  ] as const;

  return renderDocument({
    title: options.title,
    body: `
      <div class="legacy-shell">
        <aside class="legacy-sidebar">
          <a class="legacy-brand" href="/front/central.php">
            <span class="legacy-logo" aria-hidden="true">GLPI</span>
            <span>GLPI 11.0.8-dev</span>
          </a>
          <nav class="legacy-nav">
            ${nav.map(([key, href, label]) => `
              <a class="${options.active === key ? "active" : ""}" href="${href}">${label}</a>
            `).join("")}
          </nav>
        </aside>
        <div class="legacy-main">
          <header class="legacy-topbar">
            <a href="/front/central.php">Standard Interface</a>
            <div class="legacy-topbar-actions">
              <a href="/front/preference.php">Preferences</a>
              <a href="/front/logout.php">Logout</a>
            </div>
          </header>
          <main id="page" class="legacy-content" role="main" tabindex="-1">
            ${options.body}
          </main>
        </div>
      </div>
    `
  });
}

function renderDocument(options: { body: string; title: string }): string {
  return `<!doctype html>
<html lang="en" data-glpi-theme="auror" data-glpi-theme-dark="0">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>${escapeHtml(options.title)}</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <a class="visually-hidden-focusable skip-link" href="#page">Go to main content</a>
    ${options.body}
  </body>
</html>`;
}

function renderTicketRow(ticket: Ticket): string {
  return `
    <tr>
      <td><a href="/front/ticket.form.php?id=${ticket.legacyId}">${ticket.legacyId}</a></td>
      <td><a href="/front/ticket.form.php?id=${ticket.legacyId}">${escapeHtml(ticket.title)}</a></td>
      <td>${escapeHtml(ticket.requester)}</td>
      <td>${escapeHtml(ticket.assignee)}</td>
      <td>${escapeHtml(ticket.statusLabel)}</td>
      <td>${escapeHtml(ticket.priorityLabel)}</td>
      <td>${escapeHtml(ticket.typeLabel)}</td>
      <td>${formatDate(ticket.createdAt)}</td>
    </tr>
  `;
}

function metricCard(label: string, value: number): string {
  return `
    <div class="col-md-3">
      <div class="card">
        <div class="card-body">
          <div class="text-muted">${escapeHtml(label)}</div>
          <div class="h1 mb-0">${value}</div>
        </div>
      </div>
    </div>
  `;
}

function option(value: string, label: string, selectedValue: number): string {
  const selected = Number.parseInt(value, 10) === selectedValue ? " selected" : "";
  return `<option value="${value}"${selected}>${escapeHtml(label)}</option>`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "";
  }

  return escapeHtml(value.replace("T", " ").replace(".000Z", ""));
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
