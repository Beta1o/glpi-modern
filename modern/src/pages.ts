import type { Asset, GlpiUser, Metrics, Ticket } from "./store.ts";

type ShellOptions = {
  active: "central" | "tickets" | "assets" | "users";
  body: string;
  module?: PageInfo;
  title: string;
};

type PageInfo = {
  active: ShellOptions["active"];
  href: string;
  icon: string;
  label: string;
  parent: string;
  parentIcon: string;
};

const assetVersion = "9452863c0be58b3c03d0b692ee436b782ac6fa20";

const ticketSearchFieldOptions = `
  <option value="view">Items Seen</option>
  <optgroup label="Characteristics">
    <option value="1">Title</option>
    <option value="21">Description</option>
    <option value="2">ID</option>
    <option value="12" selected>Status</option>
    <option value="10">Urgency</option>
    <option value="11">Impact</option>
    <option value="3">Priority</option>
    <option value="15">Opening Date</option>
    <option value="16">Closing Date</option>
    <option value="18">Time to Resolve</option>
    <option value="19">Last Update</option>
    <option value="7">Category</option>
    <option value="80">Entity</option>
    <option value="64">Last edit by</option>
    <option value="14">Type</option>
    <option value="9">Request Source</option>
  </optgroup>
  <optgroup label="Requester">
    <option value="4">Requester</option>
    <option value="71">Requester Group</option>
    <option value="22">Writer</option>
  </optgroup>
  <optgroup label="Observer">
    <option value="66">Observer</option>
    <option value="65">Observer Group</option>
  </optgroup>
  <optgroup label="Assigned To">
    <option value="5">Technician</option>
    <option value="6">Assigned to a Supplier</option>
    <option value="8">Technician Group</option>
  </optgroup>
  <optgroup label="SLA">
    <option value="37">SLA Time to Own</option>
    <option value="30">SLA Time to Resolve</option>
    <option value="32">SLA Escalation Level</option>
  </optgroup>
  <optgroup label="Followups">
    <option value="25">Description</option>
    <option value="36">Date</option>
    <option value="27">Number of Followups</option>
    <option value="93">Writer</option>
  </optgroup>
  <optgroup label="Tasks">
    <option value="26">Description</option>
    <option value="28">Number of Tasks</option>
    <option value="20">Category</option>
    <option value="96">Duration</option>
    <option value="97">Date</option>
  </optgroup>
  <optgroup label="Statistics">
    <option value="154">Resolution Time</option>
    <option value="152">Closing Time</option>
    <option value="153">Waiting Time</option>
    <option value="150">Take into Account Time</option>
  </optgroup>
  <optgroup label="Linked Tickets">
    <option value="40">All Linked Tickets</option>
    <option value="47">Duplicated Tickets</option>
    <option value="50">Parent tickets</option>
    <option value="67">Child tickets</option>
  </optgroup>
  <optgroup label="Solution">
    <option value="23">Solution Type</option>
    <option value="24">Solution</option>
    <option value="38">Any solution status</option>
  </optgroup>
  <optgroup label="Cost">
    <option value="48">Total Cost</option>
    <option value="42">Time Cost</option>
    <option value="43">Fixed Cost</option>
    <option value="44">Material Cost</option>
  </optgroup>
`;

export function renderLoginPage(error = ""): string {
  return renderDocument({
    bodyClass: "welcome-anonymous",
    body: `
      <div class="skip-links">
        <a class="visually-hidden-focusable skip-link" href="#page">Go to main content</a>
      </div>
      <main id="page" class="page-anonymous" role="main" tabindex="-1">
        <div class="flex-fill d-flex flex-column justify-content-center py-4 mt-4">
          <div class="container-tight py-6" style="max-width: 60rem">
            <div class="text-center">
              <div class="col-md">
                <span class="glpi-logo mb-4" title="GLPI"></span>
              </div>
            </div>
            <div class="card card-md main-content-card">
              <div class="card-header"></div>
              <div class="card-body">
                ${error ? `<div class="alert alert-danger">${escapeHtml(error)}</div>` : ""}
                <form action="/front/login.php" method="post" autocomplete="off" data-submit-once>
                  <input type="hidden" name="noAUTO" value="0"/>
                  <input type="hidden" name="redirect" value=""/>
                  <input type="hidden" name="_glpi_csrf_token" value="modern-compat"/>
                  <div class="row justify-content-center">
                    <div class="col-md-5">
                      <div class="card-header mb-4">
                        <h2 class="mx-auto">Login to your account</h2>
                      </div>
                      <div class="mb-3">
                        <label class="form-label" for="login_name">Login</label>
                        <input type="text" class="form-control" id="login_name" name="login_name" placeholder="" value="glpi"/>
                      </div>
                      <div class="mb-4">
                        <div class="d-flex">
                          <label class="form-label" for="login_password">Password</label>
                        </div>
                        <input type="password" class="form-control" id="login_password" name="login_password" placeholder="" autocomplete="off"/>
                      </div>
                      <div class="mb-3">
                        <label class="form-label" for="dropdown_auth_modern">Login source</label>
                        <select name="auth" id="dropdown_auth_modern" style="width: 100%" class="form-select" size="1">
                          <option value="local" selected>GLPI internal database</option>
                        </select>
                      </div>
                      <div class="mb-2">
                        <label class="form-check" for="login_remember">
                          <input type="checkbox" class="form-check-input" id="login_remember" name="login_remember" checked/>
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
              <a href="https://glpi-project.org/" title="Powered by Teclib and contributors" class="copyright">GLPI Copyright (C) 2015-2026 Teclib' and contributors</a>
              <div style="background-image: url('/front/cron.php');"></div>
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
      <div class="dashboard central">
        <div class="row g-3">
          ${metricCard("Tickets", metrics.openTickets, "ti-alert-circle")}
          ${metricCard("Assets", metrics.assets, "ti-package")}
          ${metricCard("Users", metrics.users, "ti-users")}
          ${metricCard("Very high / Major", metrics.urgentTickets, "ti-exclamation-circle")}
        </div>
        <div class="card mt-3">
          <div class="card-header">
            <h3 class="card-title">Central</h3>
          </div>
          <div class="card-body">
            <div class="text-muted">Standard Interface</div>
          </div>
        </div>
      </div>
    `
  });
}

export function renderTicketListPage(tickets: Ticket[]): string {
  return renderShell({
    active: "tickets",
    title: "Tickets - GLPI",
    body: renderSearchPage("Ticket", "ticket", renderTicketSearchTable(tickets))
  });
}

export function renderTicketFormPage(ticket: Ticket | null, users: GlpiUser[]): string {
  const isNew = ticket === null;
  const title = isNew ? "Create Ticket" : `Ticket - ${ticket.title} - ID ${ticket.legacyId} - GLPI`;
  return renderShell({
    active: "tickets",
    title,
    body: `
      <div class="d-flex flex-column">
        <div id="navigationheader" class="navigationheader justify-content-sm-between">
          <div class="pagination-left">
            <a href="/front/ticket.php" title="List" class="btn btn-sm btn-icon btn-ghost-secondary me-2">
              <i class="ti ti-list-search fs-2"></i>
            </a>
          </div>
          <h3 class="navigationheader-title strong d-flex align-items-center order-2">
            ${ticket ? `<span class="me-1"><i class="itilstatus ti ti-circle-filled ${statusClass(ticket.statusLabel)} me-1" title="${escapeAttr(ticket.statusLabel)}"></i></span>${escapeHtml(ticket.title)} (${ticket.legacyId})` : "Create Ticket"}
          </h3>
          <div class="pagination-right">
            <span class="py-1 px-3">${ticket ? "1/1" : ""}</span>
          </div>
        </div>
        <div class="d-flex card-tabs flex-column flex-md-row vertical">
          <ul class="nav nav-tabs flex-row flex-md-column d-none d-md-block" id="tabspanel" style="min-width: 200px" role="tablist">
          ${ticketTab("Ticket", "ti-alert-circle", true)}
          ${ticketTab("Statistics", "ti-chart-pie")}
          ${ticketTab("Approvals", "ti-thumb-up")}
          ${ticketTab("Knowledge Base", "ti-lifebuoy")}
          ${ticketTab("Items", "ti-package")}
          ${ticketTab("Costs", "ti-wallet")}
          ${ticketTab("Projects", "ti-layout-kanban")}
          ${ticketTab("Project Tasks", "ti-list-check")}
          ${ticketTab("Problems", "ti-alert-triangle")}
          ${ticketTab("Changes", "ti-clipboard-check")}
          ${ticketTab("Contracts", "ti-writing-sign")}
          ${ticketTab("Historical", "ti-history")}
          ${ticketTab("All", "ti-layout-list")}
          </ul>
          <select class="form-select border-2 rounded-0 rounded-top d-md-none mb-2" id="tabspanel-select">
            <option selected>Ticket</option>
            <option>Statistics</option>
            <option>Approvals</option>
            <option>Knowledge Base</option>
            <option>Items</option>
            <option>Costs</option>
            <option>Projects</option>
            <option>Project Tasks</option>
            <option>Problems</option>
            <option>Changes</option>
            <option>Contracts</option>
            <option>Historical</option>
            <option>All</option>
          </select>
          <div class="tab-content p-2 flex-grow-1 card border-start-0" style="min-height: 150px">
            <div class="tab-pane active show" role="tabpanel">
              ${renderTicketForm(ticket, users, isNew)}
            </div>
            ${["Statistics", "Approvals", "Knowledge Base", "Items", "Costs", "Projects", "Project Tasks", "Problems", "Changes", "Contracts", "Historical"].map((label) => `
              <div data-glpi-tab-content class="tab-pane fade" role="tabpanel">
                <div class="empty"><p class="empty-title">${escapeHtml(label)}</p></div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `
  });
}

export function renderComputerListPage(assets: Asset[]): string {
  return renderShell({
    active: "assets",
    title: "Computers - GLPI",
    body: renderSearchPage("Computer", "computer", renderAssetSearchTable(assets))
  });
}

export function renderUserListPage(users: GlpiUser[]): string {
  return renderShell({
    active: "users",
    title: "Users - GLPI",
    body: renderSearchPage("User", "user", renderUserSearchTable(users))
  });
}

export function renderGenericLegacyPage(pathname: string): string {
  const module = legacyModuleInfo(pathname);
  return renderShell({
    active: module.active,
    module,
    title: `${module.label} - GLPI`,
    body: `
      <div class="legacy-module-page">
        <div id="navigationheader" class="navigationheader justify-content-sm-between">
          <div class="pagination-left">
            <a href="/front/central.php" title="Home" class="btn btn-sm btn-icon btn-ghost-secondary me-2">
              <i class="fs-2 ti ti-home-2"></i>
            </a>
          </div>
          <h3 class="navigationheader-title strong d-flex align-items-center order-2">
            <span class="me-1"><i class="ti ${escapeAttr(module.icon)} me-1"></i></span>
            ${escapeHtml(module.label)}
          </h3>
          <div class="pagination-right">
            <a href="${escapeAttr(module.href)}" class="btn btn-sm btn-icon btn-ghost-secondary ms-2" title="Refresh">
              <i class="fs-2 ti ti-refresh"></i>
            </a>
          </div>
        </div>
        <div class="card mt-2">
          <div class="card-header">
            <h2 class="card-title">${escapeHtml(module.label)}</h2>
            <div class="card-actions">
              <a href="${escapeAttr(module.href.replace(".php", ".form.php"))}" class="btn btn-sm btn-primary">
                <i class="ti ti-plus"></i>
                Add
              </a>
            </div>
          </div>
          <div class="card-body">
            <div class="empty">
              <div class="empty-icon">
                <i class="ti ${escapeAttr(module.icon)}"></i>
              </div>
              <p class="empty-title">${escapeHtml(module.label)}</p>
              <p class="empty-subtitle text-muted">
                This GLPI route is registered in the Node compatibility app and is queued for exact page-by-page migration.
              </p>
            </div>
          </div>
        </div>
      </div>
    `
  });
}

export function renderSavedSearchPartial(itemType = "Ticket"): string {
  return `
    <div class="list-group-item savedsearches-item search-line" data-id="0">
      <div class="row align-items-center">
        <div class="col-auto"><i class="ti ti-star"></i></div>
        <div class="col text-truncate">Default ${escapeHtml(itemType)} search</div>
        <div class="col-auto list-item-actions"><i class="ti ti-dots-vertical"></i></div>
      </div>
    </div>
  `;
}

export function renderCommonTabPartial(tab: string, itemType: string, id: string): string {
  return `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${escapeHtml(tabLabel(tab))}</h3>
      </div>
      <div class="card-body">
        <p class="text-muted mb-0">${escapeHtml(itemType)} ${escapeHtml(id)} ${escapeHtml(tabLabel(tab))}</p>
      </div>
    </div>
  `;
}

export function renderDisplayPreferencePage(itemType = "Ticket"): string {
  return renderDocument({
    title: `Select default items to show - ${itemType} - GLPI`,
    body: `
      <main id="page" class="container py-3" role="main" tabindex="-1">
        <form class="card">
          <div class="card-header">
            <h1 class="card-title">Select default items to show - ${escapeHtml(itemType)}</h1>
          </div>
          <div class="card-body">
            ${["ID", "Title", "Status", "Last Update", "Opening Date", "Priority", "Requester", "Assigned To", "Category", "Time to Resolve"].map((label) => `
              <label class="form-check mb-2">
                <input class="form-check-input" type="checkbox" checked>
                <span class="form-check-label">${escapeHtml(label)}</span>
              </label>
            `).join("")}
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" type="submit">Save</button>
          </div>
        </form>
      </main>
    `
  });
}

export function renderMassiveActionPartial(): string {
  return `
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Actions</h5>
          <button type="button" class="btn-close" data-glpi-modal-close aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <label class="form-label">Action</label>
          <select class="form-select">
            <option>Put in trashbin</option>
            <option>Restore</option>
            <option>Delete permanently</option>
            <option>Export</option>
          </select>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" type="button">Post</button>
        </div>
      </div>
    </div>
  `;
}

function renderShell(options: ShellOptions): string {
  return renderDocument({
    bodyClass: " vertical-layout  central",
    title: options.title,
    body: `
      <div class="skip-links">
        <a class="visually-hidden-focusable skip-link" href="#page">Go to main content</a>
      </div>

      <div class="toast-container bottom-right p-3 messages_after_redirect" id="messages_after_redirect"></div>

      <div class="page">
        ${renderSidebar(options.active)}
        ${renderMainHeader(options.active, options.module)}
        <div class="page-wrapper mb-0">
          <div class="page-body container-fluid ">
            <main role="main" id="page" class="legacy" tabindex="-1">
              ${options.body}
            </main>
          </div>
        </div>
      </div>
    `
  });
}

function renderDocument(options: { body: string; bodyClass?: string; title: string }): string {
  const fullCss = options.bodyClass === "welcome-anonymous" ? "" : `
         <link rel="stylesheet" type="text/css" href="/lib/leaflet.css?v=${assetVersion}" />
         <link rel="stylesheet" type="text/css" href="/lib/flatpickr.css?v=${assetVersion}" />
         <link rel="stylesheet" type="text/css" href="/lib/flatpickr/themes/dark.css?v=${assetVersion}" />
         <link rel="stylesheet" type="text/css" href="/lib/photoswipe.css?v=${assetVersion}" />
         <link rel="stylesheet" type="text/css" href="/lib/jquery.rateit.css?v=${assetVersion}" />
         <link rel="stylesheet" type="text/css" href="/front/css.php?file=css/standalone/dashboard.scss&amp;v=${assetVersion}" />
         <link rel="stylesheet" type="text/css" href="/lib/gridstack.css?v=${assetVersion}" />`;

  return `<!DOCTYPE html>
<html lang="en"
                    data-glpi-theme="auror"
        data-glpi-theme-dark="0"
        >
<head>
   <title>${escapeHtml(options.title)}</title>

   <meta charset="utf-8" />
   <meta http-equiv="X-UA-Compatible" content="IE=edge" />
   <meta name="viewport" content="width=device-width, initial-scale=1" />
   <meta name="robots" content="noindex, nofollow" />
   <meta property="glpi:csrf_token" content="modern-compat" />

         <link rel="stylesheet" type="text/css" href="/lib/base.css?v=${assetVersion}" />${fullCss}
         <link rel="stylesheet" type="text/css" href="/lib/tabler.css?v=${assetVersion}" />
         <link rel="stylesheet" type="text/css" href="/front/css.php?file=css/glpi.scss&amp;v=${assetVersion}" />
         <link rel="stylesheet" type="text/css" href="/front/css.php?file=css/core_palettes.scss&amp;v=${assetVersion}" />
         <link rel="stylesheet" type="text/css" href="/compat.css" />

   <link rel="shortcut icon" type="images/x-icon" href="/pics/favicon.ico" />
</head>
<body class="${options.bodyClass || ""}">
${options.body}
<script type="module" src="/compat.js"></script>
</body>
</html>`;
}

function renderSidebar(active: ShellOptions["active"]): string {
  return `
    <aside class="navbar navbar-vertical navbar-expand-lg sticky-lg-top sidebar" data-testid="sidebar" aria-label="Sidebar">
      <div class="container-fluid">
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu" aria-controls="navbar-menu" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <a href="/front/central.php" accesskey="1" title="Home" class="navbar-brand">
          <span class="glpi-logo"></span>
        </a>

        <span class="d-none d-lg-inline-block">
          <button class="btn btn-sm btn-ghost-secondary trigger-fuzzy justify-content-start mb-md-2" title="Ctrl+Alt+G">
            <i class="ti ti-arrow-big-right me-1"></i>
            <span class="menu-label ">Find menu</span>
          </button>
          <div id="fuzzy-search-modal"></div>
        </span>

        <nav class="collapse navbar-collapse" id="navbar-menu" aria-label="Main navigation">
          <ul class="navbar-nav" id="menu_modern_glpi">
            ${renderMenuGroup({
              key: "assets",
              active,
              icon: "ti-package",
              label: "Assets",
              items: [
                ["Dashboard", "/front/dashboard_assets.php", "ti-dashboard"],
                ["Computers", "/front/computer.php", "ti-device-laptop"],
                ["Monitors", "/front/monitor.php", "ti-device-desktop"],
                ["Software", "/front/software.php", "ti-apps"],
                ["Network Devices", "/front/networkequipment.php", "ti-network"],
                ["Peripherals", "/front/peripheral.php", "fab fa-usb"],
                ["Printers", "/front/printer.php", "ti-printer"],
                ["Cartridges", "/front/cartridgeitem.php", "ti-droplet-half-2-filled"],
                ["Consumables", "/front/consumableitem.php", "ti-package"],
                ["Phones", "/front/phone.php", "ti-phone"],
                ["Racks", "/front/rack.php", "ti-server"],
                ["Enclosures", "/front/enclosure.php", "ti-columns"],
                ["PDUs", "/front/pdu.php", "ti-plug"],
                ["Passive Devices", "/front/passivedcequipment.php", "ti-layout-navbar"],
                ["Unmanaged assets", "/front/unmanaged.php", "ti-question-mark"],
                ["Cables", "/front/cable.php", "ti-line"],
                ["Simcard items", "/front/item_device.php?itemtype=Item_DeviceSimcard", "ti-device-sim"],
                ["Global", "/front/allassets.php", "ti-packages"]
              ]
            })}
            ${renderMenuGroup({
              key: "tickets",
              active,
              icon: "ti-headset",
              label: "Assistance",
              items: [
                ["Dashboard", "/front/dashboard_helpdesk.php", "ti-dashboard"],
                ["Tickets", "/front/ticket.php", "ti-alert-circle"],
                ["Create Ticket", "/front/ticket.form.php", "ti-plus"],
                ["Service catalog", "/ServiceCatalog", "ti-library"],
                ["Problems", "/front/problem.php", "ti-alert-triangle"],
                ["Changes", "/front/change.php", "ti-clipboard-check"],
                ["Planning", "/front/planning.php", "ti-calendar-time"],
                ["Statistics", "/front/stat.php", "ti-chart-pie"],
                ["Recurring tickets", "/front/ticketrecurrent.php", "ti-repeat"],
                ["Recurring changes", "/front/recurrentchange.php", "ti-repeat"]
              ]
            })}
            ${renderMenuGroup({
              key: "management",
              active,
              icon: "ti-briefcase",
              label: "Management",
              items: [
                ["Licenses", "/front/softwarelicense.php", "ti-certificate"],
                ["Budgets", "/front/budget.php", "ti-cash"],
                ["Suppliers", "/front/supplier.php", "ti-building-factory-2"],
                ["Contacts", "/front/contact.php", "ti-address-book"],
                ["Contracts", "/front/contract.php", "ti-file-description"],
                ["Documents", "/front/document.php", "ti-files"],
                ["Lines", "/front/line.php", "ti-phone-call"],
                ["Certificates", "/front/certificate.php", "ti-certificate"],
                ["Datacenters", "/front/datacenter.php", "ti-building"],
                ["Clusters", "/front/cluster.php", "ti-topology-star"],
                ["Domains", "/front/domain.php", "ti-world"],
                ["Appliances", "/front/appliance.php", "ti-server-2"],
                ["Databases", "/front/database.php", "ti-database"]
              ]
            })}
            ${renderMenuGroup({
              key: "tools",
              active,
              icon: "ti-tool",
              label: "Tools",
              items: [
                ["Projects", "/front/project.php", "ti-layout-kanban"],
                ["Reminders", "/front/reminder.php", "ti-note"],
                ["RSS feed", "/front/rssfeed.php", "ti-rss"],
                ["Knowledge Base", "/front/knowbaseitem.php", "ti-lifebuoy"],
                ["Reservations", "/front/reservationitem.php", "ti-calendar"],
                ["Reports", "/front/report.php", "ti-report"],
                ["Saved Searches", "/front/savedsearch.php", "ti-star"]
              ]
            })}
            ${renderMenuGroup({
              key: "users",
              active,
              icon: "ti-users",
              label: "Administration",
              items: [
                ["Users", "/front/user.php", "ti-user"],
                ["Groups", "/front/group.php", "ti-users-group"],
                ["Entities", "/front/entity.php", "ti-sitemap"],
                ["Rules", "/front/rule.php", "ti-adjustments"],
                ["Dictionaries", "/front/dictionnary.php", "ti-book"],
                ["Profiles", "/front/profile.php", "ti-user-check"],
                ["Notification queue", "/front/queuednotification.php", "ti-mail"],
                ["Forms", "/front/form/form.php", "ti-forms"],
                ["Logs", "/front/logs.php", "ti-list-details"]
              ]
            })}
            ${renderMenuGroup({
              key: "setup",
              active,
              icon: "ti-settings",
              label: "Setup",
              items: [
                ["Inventory", "/Inventory/Configuration", "ti-package-import"],
                ["Asset definitions", "/front/asset/assetdefinition.php", "ti-asset"],
                ["Dropdowns", "/front/dropdown.php", "ti-list"],
                ["Components", "/front/devices.php", "ti-cpu"],
                ["Notifications", "/front/setup.notification.php", "ti-bell"],
                ["Webhooks", "/front/webhook.php", "ti-webhook"],
                ["Service levels", "/front/slm.php", "ti-clock"],
                ["General", "/front/config.form.php", "ti-settings"],
                ["Fields unicity", "/front/fieldunicity.php", "ti-fingerprint"],
                ["Automatic actions", "/front/crontask.php", "ti-robot"],
                ["Authentication", "/front/setup.auth.php", "ti-shield-lock"],
                ["OAuth clients", "/front/oauthclient.php", "ti-key"],
                ["Receivers", "/front/mailcollector.php", "ti-inbox"],
                ["Links", "/front/link.php", "ti-link"],
                ["Plugins", "/front/plugin.php", "ti-plug-connected"]
              ]
            })}
          </ul>

          <p class="text-start">
            <button class="btn btn-sm btn-ghost-secondary mb-2 mx-auto reduce-menu d-none d-md-block">
              <span class="menu-label">Collapse menu</span>
            </button>
          </p>
        </nav>
      </div>
    </aside>
  `;
}

function renderMenuGroup(options: {
  active: ShellOptions["active"];
  icon: string;
  items: Array<[string, string, string]>;
  key: string;
  label: string;
}): string {
  const isActive = isActiveMenuGroup(options.active, options.key);
  return `
    <li class="nav-item dropdown ${isActive ? "active" : ""}" aria-label="${escapeAttr(options.label)}">
      <button type="button"
        class="nav-link dropdown-toggle ${isActive ? "active show" : ""}"
        data-bs-toggle="dropdown"
        data-testid="sidebar-menu-toggle"
        aria-expanded="${isActive ? "true" : "false"}">
        <i class="ti ${options.icon}"></i>
        <span class="menu-label">${escapeHtml(options.label)}</span>
      </button>
      <div class="dropdown-menu ${isActive ? "animate__fadeInLeft show" : "animate__animated animate__fadeInLeft"}">
        <h6 class="dropdown-header">${escapeHtml(options.label)}</h6>
        <div class="dropdown-menu-columns">
          <div class="dropdown-menu-column">
            ${options.items.map(([label, href, icon]) => renderMenuItem(label, href, icon, isActive && isActiveRoute(options.active, href))).join("")}
          </div>
        </div>
      </div>
    </li>
  `;
}

function renderMenuItem(label: string, href: string, icon: string, active: boolean): string {
  return `
    <a class="dropdown-item ${active ? "active" : ""}" href="${escapeAttr(href)}" aria-label="${escapeAttr(label)}">
      <i class="${escapeAttr(iconClass(icon))}"></i>
      <span class="text-wrap">${escapeHtml(label)}</span>
    </a>
  `;
}

function iconClass(icon: string): string {
  return icon.startsWith("ti-") ? `ti ${icon}` : icon;
}

function isActiveMenuGroup(active: ShellOptions["active"], key: string): boolean {
  return active === key;
}

function isActiveRoute(active: ShellOptions["active"], href: string): boolean {
  return (
    (active === "tickets" && href === "/front/ticket.php") ||
    (active === "assets" && href === "/front/computer.php") ||
    (active === "users" && href === "/front/user.php") ||
    (active === "central" && href === "/front/central.php")
  );
}

function renderMainHeader(active: ShellOptions["active"], module?: PageInfo): string {
  const current = module || pageInfo(active);
  return `
    <header class="navbar d-print-none sticky-lg-top shadow-sm navbar-light navbar-expand-md" data-testid="main-header" role="banner">
      <div class="header-container container-fluid flex-xl-nowrap pe-xl-0 ">
        <nav aria-label="Breadcrumbs">
          <ol class="breadcrumb breadcrumb-alternate pe-1 pe-sm-3">
            <li class="breadcrumb-item text-truncate">
              <a href="/front/central.php" class="d-inline-flex align-items-center gap-1" title="Home">
                <i class="ti ti-home-2"></i>
                Home
              </a>
            </li>
            ${current.parent ? `
              <li class="breadcrumb-item text-truncate">
                <a href="${escapeAttr(current.href)}" class="d-inline-flex align-items-center gap-1" title="${escapeAttr(current.parent)}">
                  <i class="ti ${escapeAttr(current.parentIcon)}"></i>
                  ${escapeHtml(current.parent)}
                </a>
              </li>
            ` : ""}
            <li class="breadcrumb-item text-truncate">
              <a href="${escapeAttr(current.href)}" class="d-inline-flex align-items-center gap-1 here" title="${escapeAttr(current.label)}">
                <i class="ti ${escapeAttr(current.icon)}"></i>
                ${escapeHtml(current.label)}
              </a>
            </li>
          </ol>
        </nav>

        <ul class="nav navbar-nav border-start border-left ps-1 ps-sm-2 flex-row">
          ${renderHeaderActions(active)}
        </ul>

        <div class="ms-lg-auto d-none d-lg-block flex-grow-1 flex-lg-grow-0">
          <form action="/front/search.php" role="search" method="get" data-submit-once>
            <label for="global-search" class="visually-hidden">Search</label>
            <div class="input-group input-group-flat">
              <input type="text" id="global-search" class="form-control" name="globalsearch" placeholder="Search" />
              <span class="input-group-text p-0">
                <button type="submit" class="btn btn-link p-0 m-0" title="Search">
                  <span class="ti ti-search" aria-hidden="true"></span>
                </button>
              </span>
            </div>
          </form>
        </div>

        <div class="ms-md-4 d-none d-lg-block">
          ${renderUserMenu()}
        </div>
      </div>
    </header>
  `;
}

function pageInfo(active: ShellOptions["active"]): PageInfo {
  if (active === "tickets") {
    return { active, href: "/front/ticket.php", icon: "ti-alert-circle", label: "Tickets", parent: "Assistance", parentIcon: "ti-headset" };
  }
  if (active === "assets") {
    return { active, href: "/front/computer.php", icon: "ti-device-laptop", label: "Computers", parent: "Assets", parentIcon: "ti-package" };
  }
  if (active === "users") {
    return { active, href: "/front/user.php", icon: "ti-user", label: "Users", parent: "Administration", parentIcon: "ti-users" };
  }
  return { active, href: "/front/central.php", icon: "ti-dashboard", label: "Dashboard", parent: "", parentIcon: "" };
}

function renderHeaderActions(active: ShellOptions["active"]): string {
  if (active === "tickets") {
    return `
      <li class="nav-item">
        <a href="/front/ticket.form.php" class="btn btn-sm btn-primary me-1 pe-2" title="Add">
          <i class="ti ti-plus"></i>
          <span class="d-none d-xxl-block">Add</span>
        </a>
      </li>
      <li class="nav-item">
        <a href="/front/tickettemplate.php" class="btn btn-sm btn-ghost-secondary me-1 pe-2" title="Manage Templates...">
          <i class="ti ti-template"></i>
          <span class="d-none d-xxl-block">Templates</span>
        </a>
      </li>
      <li class="nav-item">
        <a href="/front/ticket.form.php?showglobalkanban=1" class="btn btn-sm btn-ghost-secondary me-1 pe-2" title="Global Kanban">
          <i class="ti ti-layout-columns"></i>
          <span class="d-none d-xxl-block">Global Kanban</span>
        </a>
      </li>
    `;
  }

  if (active === "assets") {
    return `<li class="nav-item"><a href="/front/computer.form.php" class="btn btn-sm btn-primary me-1 pe-2" title="Add"><i class="ti ti-plus"></i><span class="d-none d-xxl-block">Add</span></a></li>`;
  }

  if (active === "users") {
    return `<li class="nav-item"><a href="/front/user.form.php" class="btn btn-sm btn-primary me-1 pe-2" title="Add"><i class="ti ti-plus"></i><span class="d-none d-xxl-block">Add</span></a></li>`;
  }

  return "";
}

function renderUserMenu(): string {
  return `
    <div class="btn-group">
      <div class="navbar-nav flex-row order-md-last user-menu">
        <div class="nav-item dropdown">
          <a href="#" class="nav-link d-flex lh-1 text-reset p-1 dropdown-toggle user-menu-dropdown-toggle" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-label="User menu">
            <div class="pe-2 d-none d-xl-block">
              <div>Super-Admin</div>
              <div class="mt-1 small text-muted-menu" title="Root Entity (tree structure)" data-testid="current-entity">Root Entity (tree structure)</div>
            </div>
            <span class="avatar rounded" style=" background-color: #db6b57; aspect-ratio: 1;">GL</span>
          </a>
          <div class="dropdown-menu dropdown-menu-end mt-1 dropdown-menu-arrow animate__animated animate__fadeInRight" data-testid="user-menu-dropdown">
            <h6 class="dropdown-header">glpi</h6>
            <span class="dropdown-item dropdown-item-text" title="Root Entity (tree structure)">
              <i class="ti ti-stack"></i>
              Root Entity (tree structure)
            </span>
            <div class="dropdown-divider"></div>
            <a href="/ajax/switchdebug.php" class="dropdown-item" title="Change mode">
              <i class="ti ti-bug debug"></i>
              Debug mode disabled
            </a>
            <a href="https://glpi-project.org/documentation" class="dropdown-item" title="Help">
              <i class="ti ti-help"></i>
              Help
            </a>
            <a href="#" class="dropdown-item" title="About">
              <i class="ti ti-info-circle"></i>
              About
            </a>
            <div class="dropdown-divider"></div>
            <a href="/front/preference.php" class="dropdown-item" title="My Settings">
              <i class="ti ti-user-cog"></i>
              My Settings
            </a>
            <a href="/front/logout.php" class="dropdown-item" title="Logout">
              <i class="ti ti-logout"></i>
              Logout
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSearchPage(itemType: string, itemClass: string, table: string): string {
  return `
    <div class="search_page row" data-testid="search-page" data-glpi-search-container>
      <div class="card col-2 d-flex flex-column responsive-toggle d-none saved-searches-panel ${escapeAttr(itemClass)}">
        <div class="card-header d-flex flex-nowrap pe-0 align-items-center text-muted">
          <i class="ti ti-star"></i>&nbsp;
          <span class="text-truncate">Saved Searches</span>
          <li class="ms-auto btn-list me-1 flex-nowrap">
            <a href="/front/savedsearch.php" class="btn btn-sm btn-icon btn-ghost-secondary" title="Manage all saved searches"><i class="ti ti-settings"></i></a>
            <button class="btn btn-sm btn-icon btn-ghost-secondary ms-1 d-none d-md-block pin-saved-searches-panel" title="Pin this panel for the current page"><i class="ti ti-pinned"></i></button>
            <button class="btn btn-sm btn-icon btn-ghost-secondary ms-1 close-saved-searches-panel" title="Close the panel"><i class="ti ti-x"></i></button>
          </li>
        </div>
        <div class="saved-searches-tabs">
          <ul class="nav nav-tabs border-0" data-bs-toggle="tabs">
            <li class="nav-item">
              <a class="nav-link active" data-bs-target="#itemtype-filtered" data-bs-toggle="tab" href="/ajax/savedsearch.php?action=display_mine&amp;itemtype=${escapeAttr(itemType)}">${escapeHtml(itemType)}</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" data-bs-target="#all-savedsearches" data-bs-toggle="tab" href="/ajax/savedsearch.php?action=display_mine&amp;inverse=true&amp;itemtype=${escapeAttr(itemType)}">Others</a>
            </li>
          </ul>
          <div class="saved-searches-panel-content tab-content">
            <div class="list-group list-group-flush list-group-hoverable saved-searches-panel-lists tab-pane show active" id="itemtype-filtered">
              ${renderSavedSearchPartial(itemType)}
            </div>
            <div class="list-group list-group-flush list-group-hoverable saved-searches-panel-lists tab-pane" id="all-savedsearches">
              ${renderSavedSearchPartial("All")}
            </div>
          </div>
        </div>
        <div class="card-footer">
          <div class="input-group input-group-flat filter_savedsearch">
            <input type="text" name="saved_searches_filter_list_input" class="form-control form-control-sm" placeholder="Filter list" />
            <span class="input-group-text">
              <a href="#" class="link-secondary clear-text" role="button" title="Clear search"><i class="ti ti-x fs-5"></i></a>
            </span>
          </div>
        </div>
      </div>
      <div class="col search-container">
        <div class="card search-card" data-testid="search-format-table">
          <div class="massiveactions-control card-header search-header ps-3 animate__animated animate__faster d-none">
            <button type="button" class="btn btn-sm btn-primary me-2" data-glpi-modal-url="/front/massiveaction.php" title="Actions">
              <i class="ti ti-corner-left-down mt-1"></i>
              <span>Actions</span>
            </button>
          </div>
          <div class="card-header search-header px-1 px-xl-3">
            <div class="search-controls d-flex justify-content-between align-items-center">
              <form name="searchform${escapeAttr(itemType)}" class="search-form-container needs-validation" novalidate method="get" action="/front/${itemClass}.php" data-glpi-search-form>
                <div class="primary-controls">
                  <div class="btn-group me-1 me-xl-2">
                    <button type="button" class="btn btn-icon btn-sm p-1 btn-ghost-secondary show-saved-searches" data-itemtype="${escapeAttr(itemType)}" title="Show saved searches">
                      <i class="ti ti-bookmarks"></i>
                    </button>
                    <button class="btn btn-sm py-1 show-search-filters btn-ghost-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" data-testid="search-filters-button">
                      <i class="ti ti-list-search"></i>
                      <span class="d-none d-xl-inline-block">Search</span>
                    </button>
                    <div class="dropdown-menu dropdown-menu-card animate__animated animate__zoomIn" style="width: max-content; max-width: 100vw;" data-testid="search-filters-panel">
                      <div class="search-form card card-sm">
                        <div class="list-group list-group-flush list-group-hoverable criteria-list pt-2">
                          <div class="list-group-item p-2 border-0 normalcriteria">
                            <div class="row g-1 align-items-center">
                              <div class="col-auto">
                                <button class="btn btn-sm btn-icon btn-ghost-secondary remove-search-criteria" type="button" title="Delete a Rule">
                                  <i class="ti ti-square-rounded-minus"></i>
                                </button>
                              </div>
                              <div class="col-auto"><select class="form-select" name="criteria[0][link]"><option selected>-----</option><option>NOT</option></select></div>
                              <div class="col-auto"><select class="form-select" name="criteria[0][field]">${ticketSearchFieldOptions}</select></div>
                              <div class="col-auto"><select class="form-select" name="criteria[0][searchtype]"><option selected>is</option><option>contains</option><option>is empty</option></select></div>
                              <div class="col-auto">
                                <select class="form-select" name="criteria[0][value]">
                                  <option value="1">New</option>
                                  <option value="2">Processing (assigned)</option>
                                  <option value="3">Processing (planned)</option>
                                  <option value="4">Pending</option>
                                  <option value="5">Solved</option>
                                  <option value="6">Closed</option>
                                  <option value="notold" selected>Not Solved</option>
                                  <option value="notclosed">Not Closed</option>
                                  <option value="all">All</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                        <input type="hidden" name="params[hide_criteria]" value="0">
                        <input type="hidden" name="params[hide_controls]" value="0">
                        <input type="hidden" name="params[showmassiveactions]" value="1">
                        <div class="card-footer d-flex search_actions">
                          <button class="btn btn-sm btn-ghost-secondary me-1" type="button"><i class="ti ti-square-plus"></i><span class="d-none d-sm-block">rule</span></button>
                          <button class="btn btn-sm btn-ghost-secondary me-1" type="button"><i class="ti ti-circle-plus"></i><span class="d-none d-sm-block">global rule</span></button>
                          <button class="btn btn-sm btn-ghost-secondary me-1" type="button"><i class="ti ti-code-plus"></i><span class="d-none d-sm-block">group</span></button>
                          <div class="btn-group ms-auto">
                            <button class="btn btn-sm btn-primary" type="submit"><i class="ti ti-search"></i><span class="d-none d-sm-block">Search</span></button>
                            <a class="btn btn-sm btn-ghost-secondary" href="/front/${itemClass}.php?reset=reset"><i class="ti ti-square-x"></i></a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
              <div class="middle-controls d-flex"></div>
              <div class="secondary-controls">
                <div class="btn-group me-1 me-xl-2 shadow-none" role="group">
                  <input type="radio" class="btn-check" name="as_map" value="0" autocomplete="off" id="show_as_table_${escapeAttr(itemClass)}" checked>
                  <label class="btn btn-icon btn-sm btn-pill px-2 py-1 btn-ghost-info" title="Show as table" for="show_as_table_${escapeAttr(itemClass)}"><i class="ti ti-table"></i></label>
                  <input type="radio" class="btn-check" name="as_map" value="1" autocomplete="off" id="show_as_map_${escapeAttr(itemClass)}">
                  <label class="btn btn-icon btn-sm btn-pill px-2 py-1" title="Show as map" for="show_as_map_${escapeAttr(itemClass)}"><i class="ti ti-map-2"></i></label>
                </div>
                <button class="btn btn-icon btn-sm btn-ghost-danger me-1 me-xl-2 px-1" type="button" title="Show the Trash">
                  <i class="ti ti-square"></i><span class="d-flex align-bottom"><i class="ti ti-trash"></i></span>
                </button>
                <button class="show_displaypreference_modal btn btn-sm btn-ghost-secondary" type="button" title="Select default items to show" data-glpi-modal-url="/front/displaypreference.form.php?itemtype=${escapeAttr(itemType)}">
                  <i class="ti ti-table-row"></i>
                </button>
                <button type="button" class="btn btn-icon btn-sm p-1 btn-ghost-secondary refresh-search" title="Refresh"><i class="ti ti-refresh"></i></button>
                <button class="dropdown-toggle btn btn-sm btn-ghost-secondary" type="button" id="dropdown-export-${escapeAttr(itemClass)}" data-bs-toggle="dropdown" aria-expanded="false">
                  <span title="Export"><i id="export_dropdown_icon" class="ti ti-download"></i></span>
                </button>
                <div class="dropdown-menu" aria-labelledby="dropdown-export-${escapeAttr(itemClass)}" role="menu">
                  <div role="separator"><h6 class="dropdown-header">Current page</h6></div>
                  <a class="dropdown-item" href="/front/report.dynamic.php?item_type=${escapeAttr(itemType)}&amp;display_type=2"><i class="ti ti-file-type-pdf"></i>Landscape PDF</a>
                  <a class="dropdown-item" href="/front/report.dynamic.php?item_type=${escapeAttr(itemType)}&amp;display_type=4"><i class="ti ti-file-type-pdf"></i>Portrait PDF</a>
                  <a class="dropdown-item" href="/front/report.dynamic.php?item_type=${escapeAttr(itemType)}&amp;display_type=3"><i class="ti ti-file-type-csv"></i>CSV</a>
                  <a class="dropdown-item" href="/front/report.dynamic.php?item_type=${escapeAttr(itemType)}&amp;display_type=6"><i class="ti ti-file-spreadsheet"></i>Spreadsheet (ODS)</a>
                  <a class="dropdown-item" href="/front/report.dynamic.php?item_type=${escapeAttr(itemType)}&amp;display_type=7"><i class="ti ti-file-spreadsheet"></i>Spreadsheet (XLSX)</a>
                  <hr class="dropdown-divider">
                  <div role="separator"><h6 class="dropdown-header">All Pages</h6></div>
                  <a class="dropdown-item" href="/front/report.dynamic.php?item_type=${escapeAttr(itemType)}&amp;display_type=-3"><i class="ti ti-file-type-csv"></i>CSV</a>
                  <a class="dropdown-item" href="/front/report.dynamic.php?item_type=${escapeAttr(itemType)}&amp;display_type=-5"><i class="ti ti-copy"></i>Copy names to clipboard</a>
                </div>
              </div>
            </div>
          </div>
          ${table}
        </div>
      </div>
    </div>
  `;
}

function renderTicketSearchTable(tickets: Ticket[]): string {
  return `
    <form id="massformTicketModern" method="get" action="/front/massiveaction.php" data-search-itemtype="Ticket" data-start="0" data-count="${tickets.length}" data-limit="20" data-submit-once class="masssearchform">
      <div class="table-responsive-lg">
        <table class="search-results table card-table table-hover table-striped" data-testid="search-results" id="search_modern_ticket">
          <thead>
            <tr>
              <th style="width: 30px;"><input class="form-check-input massive_action_checkbox" type="checkbox" id="checkall_modern_ticket" value="" aria-label="Check all as" form="massformTicketModern" /></th>
              <th data-searchopt-id="2" data-sort-order="nosort">ID <span class="sort-indicator"><i class=""></i><span class="sort-num"></span></span></th>
              <th data-searchopt-id="1" data-sort-order="nosort">Title <span class="sort-indicator"><i class=""></i><span class="sort-num"></span></span></th>
              <th data-searchopt-id="12" data-sort-order="nosort">Status <span class="sort-indicator"><i class=""></i><span class="sort-num"></span></span></th>
              <th data-searchopt-id="19" data-sort-order="DESC" data-sort-num="0">Last Update <span class="sort-indicator"><i class="ti ti-caret-up-filled"></i><span class="sort-num"></span></span></th>
              <th data-searchopt-id="15" data-sort-order="nosort">Opening Date <span class="sort-indicator"><i class=""></i><span class="sort-num"></span></span></th>
              <th data-searchopt-id="3" data-sort-order="nosort">Priority <span class="sort-indicator"><i class=""></i><span class="sort-num"></span></span></th>
              <th data-searchopt-id="4" data-sort-order="nosort">Requester - Requester <span class="sort-indicator"><i class=""></i><span class="sort-num"></span></span></th>
              <th data-searchopt-id="5" data-sort-order="nosort">Assigned To - Technician <span class="sort-indicator"><i class=""></i><span class="sort-num"></span></span></th>
              <th data-searchopt-id="7" data-sort-order="nosort">Category <span class="sort-indicator"><i class=""></i><span class="sort-num"></span></span></th>
              <th data-searchopt-id="18" data-sort-order="nosort">Time to Resolve <span class="sort-indicator"><i class=""></i><span class="sort-num"></span></span></th>
            </tr>
          </thead>
          <tbody>
            ${tickets.map(renderTicketSearchRow).join("") || `<tr><td colspan="11" class="text-muted">No item found</td></tr>`}
          </tbody>
        </table>
      </div>
      ${renderSearchFooter(tickets.length)}
    </form>
  `;
}

function renderTicketSearchRow(ticket: Ticket): string {
  return `
    <tr>
      <td><input class="form-check-input massive_action_checkbox" type="checkbox" data-glpicore-ma-tags="common" value="${ticket.legacyId}" aria-label="Select item" name="item[Ticket][${ticket.legacyId}]" form="massformTicketModern" /></td>
      <td data-searchopt-content-id="2" valign="top"><span class="text-nowrap">${ticket.legacyId}</span></td>
      <td data-searchopt-content-id="1" valign="top"><a id="Ticket${ticket.legacyId}" href="/front/ticket.form.php?id=${ticket.legacyId}">${escapeHtml(ticket.title)}</a></td>
      <td data-searchopt-content-id="12" valign="top"><span class="text-nowrap"><i class="itilstatus ti ti-circle-filled ${statusClass(ticket.statusLabel)} me-1" title="${escapeAttr(ticket.statusLabel)}"></i>&nbsp;${escapeHtml(ticket.statusLabel)}</span></td>
      <td data-searchopt-content-id="19" valign="top"><span class="text-nowrap">${formatDate(ticket.updatedAt)}</span></td>
      <td data-searchopt-content-id="15" valign="top"><span class="text-nowrap">${formatDate(ticket.createdAt)}</span></td>
      <td data-searchopt-content-id="3" valign="top"><div class="badge_block" style="border-color: #ffcece"><span style="background: #ffcece"></span>&nbsp;${escapeHtml(ticket.priorityLabel)}</div></td>
      <td data-searchopt-content-id="4" valign="top">${escapeHtml(ticket.requester)}</td>
      <td data-searchopt-content-id="5" valign="top">${escapeHtml(ticket.assignee)}</td>
      <td data-searchopt-content-id="7" valign="top"></td>
      <td data-searchopt-content-id="18" valign="top"><span class="text-nowrap"></span></td>
    </tr>
  `;
}

function renderAssetSearchTable(assets: Asset[]): string {
  return `
    <div class="table-responsive-lg">
      <table class="search-results table card-table table-hover table-striped" data-testid="search-results">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Serial number</th>
            <th>User</th>
            <th>Status</th>
            <th>Location</th>
            <th>Last update</th>
          </tr>
        </thead>
        <tbody>
          ${assets.map((asset) => `
            <tr>
              <td><a href="/front/computer.form.php">${escapeHtml(asset.name)}</a></td>
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
    ${renderSearchFooter(assets.length)}
  `;
}

function renderUserSearchTable(users: GlpiUser[]): string {
  return `
    <div class="table-responsive-lg">
      <table class="search-results table card-table table-hover table-striped" data-testid="search-results">
        <thead>
          <tr><th>ID</th><th>Login</th><th>Name</th></tr>
        </thead>
        <tbody>
          ${users.map((user) => `
            <tr>
              <td><span class="text-nowrap">${user.id}</span></td>
              <td><a href="/front/user.form.php?id=${user.id}">${escapeHtml(user.login)}</a></td>
              <td>${escapeHtml(user.displayName)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    ${renderSearchFooter(users.length)}
  `;
}

function renderSearchFooter(total: number): string {
  return `
    <div class="card-footer search-footer d-block">
      <div class="flex-grow-1 d-flex flex-wrap flex-md-nowrap align-items-center justify-content-between mb-2 search-pager">
        <span class="search-limit d-none d-md-block">
          <select class="form-select form-select-sm mx-1 d-inline-block w-auto search-limit-dropdown" name="list_limit">
            <option value="20" selected>20</option>
            <option value="40">40</option>
            <option value="80">80</option>
          </select>
        </span>
        <span class="search-results-count">${total} item${total === 1 ? "" : "s"}</span>
        <span class="btn-group">
          <button class="btn btn-sm btn-ghost-secondary disabled" type="button"><i class="ti ti-chevron-left"></i></button>
          <button class="btn btn-sm btn-ghost-secondary disabled" type="button"><i class="ti ti-chevron-right"></i></button>
        </span>
      </div>
    </div>
  `;
}

function renderTicketForm(ticket: Ticket | null, users: GlpiUser[], isNew: boolean): string {
  return `
    <form class="itil-object ticket-main-form" action="/front/ticket.form.php${ticket ? `?id=${ticket.legacyId}` : ""}" method="post" data-submit-once>
      <input type="hidden" name="_glpi_csrf_token" value="modern-compat"/>
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">${isNew ? "Create Ticket" : escapeHtml(ticket.title)}</h2>
          ${ticket ? `<span class="badge bg-blue-lt">ID ${ticket.legacyId}</span>` : ""}
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
                ${option("2", "Processing (assigned)", ticket?.statusValue || 1)}
                ${option("3", "Processing (planned)", ticket?.statusValue || 1)}
                ${option("4", "Pending", ticket?.statusValue || 1)}
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
        <div class="card-footer d-flex flex-wrap gap-2">
          <button class="btn btn-primary" type="submit" name="_action" value="${isNew ? "create" : "update"}">${isNew ? "Add" : "Save"}</button>
          <a class="btn btn-ghost-secondary" href="/front/ticket.php">Back to list</a>
          ${ticket ? `
            <button class="btn btn-outline-danger" type="submit" name="_action" value="delete">Put in trashbin</button>
            <button class="btn btn-outline-secondary" type="submit" name="_action" value="restore">Restore</button>
            <button class="btn btn-danger" type="submit" name="_action" value="purge">Delete permanently</button>
          ` : ""}
        </div>
      </div>
    </form>
  `;
}

function ticketTab(label: string, icon: string, active = false): string {
  return `
    <li class="nav-item ms-0">
      <a class="nav-link justify-content-between pe-1 ${active ? "active" : ""}" data-bs-toggle="tab" href="#" aria-label="${escapeAttr(label)}">
        <span class="d-flex align-items-center"><i class="ti ${escapeAttr(icon)} me-2"></i>${escapeHtml(label)}</span>
      </a>
    </li>
  `;
}

function metricCard(label: string, value: number, icon: string): string {
  return `
    <div class="col-sm-6 col-lg-3">
      <div class="card">
        <div class="card-body d-flex align-items-center">
          <span class="avatar me-3 rounded bg-blue-lt"><i class="ti ${escapeAttr(icon)}"></i></span>
          <div>
            <div class="text-muted">${escapeHtml(label)}</div>
            <div class="h1 mb-0">${value}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function statusClass(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("closed")) {
    return "closed";
  }
  if (normalized.includes("solved")) {
    return "solved";
  }
  if (normalized.includes("pending") || normalized.includes("waiting")) {
    return "waiting";
  }
  if (normalized.includes("assigned") || normalized.includes("planned")) {
    return "process";
  }
  return "new";
}

function legacyModuleInfo(pathname: string): PageInfo {
  const normalized = pathname.replace(/\/$/, "");
  const entry = legacyModuleLabels.get(normalized) || inferLegacyModule(normalized);
  return {
    active: entry.active,
    href: normalized || "/front/central.php",
    icon: entry.icon,
    label: entry.label,
    parent: entry.parent,
    parentIcon: entry.parentIcon
  };
}

function inferLegacyModule(pathname: string): PageInfo {
  const raw = pathname.split("/").pop()?.replace(/\.php$/, "").replace(/_/g, " ") || "Page";
  const label = raw
    .split(/[.\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    active: "central",
    href: pathname,
    icon: "ti-file",
    label: label || "Page",
    parent: "GLPI",
    parentIcon: "ti-dashboard"
  };
}

function tabLabel(tab: string): string {
  if (tab.includes("Ticket$main")) {
    return "Ticket";
  }
  if (tab.includes("Ticket$4")) {
    return "Statistics";
  }
  if (tab.includes("TicketValidation")) {
    return "Approvals";
  }
  if (tab.includes("KnowbaseItem")) {
    return "Knowledge Base";
  }
  if (tab.includes("Item_Ticket")) {
    return "Items";
  }
  if (tab.includes("TicketCost")) {
    return "Costs";
  }
  if (tab.includes("ProjectTask")) {
    return "Project Tasks";
  }
  if (tab.includes("Problem")) {
    return "Problems";
  }
  if (tab.includes("Change")) {
    return "Changes";
  }
  if (tab.includes("Contract")) {
    return "Contracts";
  }
  if (tab.includes("Log")) {
    return "Historical";
  }
  return tab || "Tab";
}

const legacyModuleLabels = new Map<string, PageInfo>([
  ["/front/central.php", { active: "central", href: "/front/central.php", icon: "ti-dashboard", label: "Dashboard", parent: "", parentIcon: "" }],
  ["/front/dashboard_assets.php", { active: "assets", href: "/front/dashboard_assets.php", icon: "ti-dashboard", label: "Dashboard", parent: "Assets", parentIcon: "ti-package" }],
  ["/front/computer.php", { active: "assets", href: "/front/computer.php", icon: "ti-device-laptop", label: "Computers", parent: "Assets", parentIcon: "ti-package" }],
  ["/front/monitor.php", { active: "assets", href: "/front/monitor.php", icon: "ti-device-desktop", label: "Monitors", parent: "Assets", parentIcon: "ti-package" }],
  ["/front/software.php", { active: "assets", href: "/front/software.php", icon: "ti-apps", label: "Software", parent: "Assets", parentIcon: "ti-package" }],
  ["/front/networkequipment.php", { active: "assets", href: "/front/networkequipment.php", icon: "ti-network", label: "Network Devices", parent: "Assets", parentIcon: "ti-package" }],
  ["/front/peripheral.php", { active: "assets", href: "/front/peripheral.php", icon: "ti-usb", label: "Peripherals", parent: "Assets", parentIcon: "ti-package" }],
  ["/front/printer.php", { active: "assets", href: "/front/printer.php", icon: "ti-printer", label: "Printers", parent: "Assets", parentIcon: "ti-package" }],
  ["/front/cartridgeitem.php", { active: "assets", href: "/front/cartridgeitem.php", icon: "ti-droplet-half-2-filled", label: "Cartridges", parent: "Assets", parentIcon: "ti-package" }],
  ["/front/consumableitem.php", { active: "assets", href: "/front/consumableitem.php", icon: "ti-package", label: "Consumables", parent: "Assets", parentIcon: "ti-package" }],
  ["/front/phone.php", { active: "assets", href: "/front/phone.php", icon: "ti-phone", label: "Phones", parent: "Assets", parentIcon: "ti-package" }],
  ["/front/rack.php", { active: "assets", href: "/front/rack.php", icon: "ti-server", label: "Racks", parent: "Assets", parentIcon: "ti-package" }],
  ["/front/enclosure.php", { active: "assets", href: "/front/enclosure.php", icon: "ti-columns", label: "Enclosures", parent: "Assets", parentIcon: "ti-package" }],
  ["/front/pdu.php", { active: "assets", href: "/front/pdu.php", icon: "ti-plug", label: "PDUs", parent: "Assets", parentIcon: "ti-package" }],
  ["/front/passivedcequipment.php", { active: "assets", href: "/front/passivedcequipment.php", icon: "ti-layout-navbar", label: "Passive Devices", parent: "Assets", parentIcon: "ti-package" }],
  ["/front/unmanaged.php", { active: "assets", href: "/front/unmanaged.php", icon: "ti-question-mark", label: "Unmanaged assets", parent: "Assets", parentIcon: "ti-package" }],
  ["/front/cable.php", { active: "assets", href: "/front/cable.php", icon: "ti-line", label: "Cables", parent: "Assets", parentIcon: "ti-package" }],
  ["/front/allassets.php", { active: "assets", href: "/front/allassets.php", icon: "ti-packages", label: "Global", parent: "Assets", parentIcon: "ti-package" }],
  ["/front/dashboard_helpdesk.php", { active: "tickets", href: "/front/dashboard_helpdesk.php", icon: "ti-dashboard", label: "Dashboard", parent: "Assistance", parentIcon: "ti-headset" }],
  ["/front/ticket.php", { active: "tickets", href: "/front/ticket.php", icon: "ti-alert-circle", label: "Tickets", parent: "Assistance", parentIcon: "ti-headset" }],
  ["/front/ticket.form.php", { active: "tickets", href: "/front/ticket.form.php", icon: "ti-plus", label: "Create Ticket", parent: "Assistance", parentIcon: "ti-headset" }],
  ["/ServiceCatalog", { active: "tickets", href: "/ServiceCatalog", icon: "ti-library", label: "Service catalog", parent: "Assistance", parentIcon: "ti-headset" }],
  ["/front/problem.php", { active: "tickets", href: "/front/problem.php", icon: "ti-alert-triangle", label: "Problems", parent: "Assistance", parentIcon: "ti-headset" }],
  ["/front/change.php", { active: "tickets", href: "/front/change.php", icon: "ti-clipboard-check", label: "Changes", parent: "Assistance", parentIcon: "ti-headset" }],
  ["/front/planning.php", { active: "tickets", href: "/front/planning.php", icon: "ti-calendar-time", label: "Planning", parent: "Assistance", parentIcon: "ti-headset" }],
  ["/front/stat.php", { active: "tickets", href: "/front/stat.php", icon: "ti-chart-pie", label: "Statistics", parent: "Assistance", parentIcon: "ti-headset" }],
  ["/front/softwarelicense.php", { active: "central", href: "/front/softwarelicense.php", icon: "ti-certificate", label: "Licenses", parent: "Management", parentIcon: "ti-briefcase" }],
  ["/front/budget.php", { active: "central", href: "/front/budget.php", icon: "ti-cash", label: "Budgets", parent: "Management", parentIcon: "ti-briefcase" }],
  ["/front/supplier.php", { active: "central", href: "/front/supplier.php", icon: "ti-building-factory-2", label: "Suppliers", parent: "Management", parentIcon: "ti-briefcase" }],
  ["/front/contact.php", { active: "central", href: "/front/contact.php", icon: "ti-address-book", label: "Contacts", parent: "Management", parentIcon: "ti-briefcase" }],
  ["/front/contract.php", { active: "central", href: "/front/contract.php", icon: "ti-file-description", label: "Contracts", parent: "Management", parentIcon: "ti-briefcase" }],
  ["/front/document.php", { active: "central", href: "/front/document.php", icon: "ti-files", label: "Documents", parent: "Management", parentIcon: "ti-briefcase" }],
  ["/front/project.php", { active: "central", href: "/front/project.php", icon: "ti-layout-kanban", label: "Projects", parent: "Tools", parentIcon: "ti-tool" }],
  ["/front/reminder.php", { active: "central", href: "/front/reminder.php", icon: "ti-note", label: "Reminders", parent: "Tools", parentIcon: "ti-tool" }],
  ["/front/rssfeed.php", { active: "central", href: "/front/rssfeed.php", icon: "ti-rss", label: "RSS feed", parent: "Tools", parentIcon: "ti-tool" }],
  ["/front/knowbaseitem.php", { active: "central", href: "/front/knowbaseitem.php", icon: "ti-lifebuoy", label: "Knowledge Base", parent: "Tools", parentIcon: "ti-tool" }],
  ["/front/reservationitem.php", { active: "central", href: "/front/reservationitem.php", icon: "ti-calendar", label: "Reservations", parent: "Tools", parentIcon: "ti-tool" }],
  ["/front/report.php", { active: "central", href: "/front/report.php", icon: "ti-report", label: "Reports", parent: "Tools", parentIcon: "ti-tool" }],
  ["/front/savedsearch.php", { active: "central", href: "/front/savedsearch.php", icon: "ti-star", label: "Saved Searches", parent: "Tools", parentIcon: "ti-tool" }],
  ["/front/user.php", { active: "users", href: "/front/user.php", icon: "ti-user", label: "Users", parent: "Administration", parentIcon: "ti-users" }],
  ["/front/group.php", { active: "users", href: "/front/group.php", icon: "ti-users-group", label: "Groups", parent: "Administration", parentIcon: "ti-users" }],
  ["/front/entity.php", { active: "users", href: "/front/entity.php", icon: "ti-sitemap", label: "Entities", parent: "Administration", parentIcon: "ti-users" }],
  ["/front/rule.php", { active: "users", href: "/front/rule.php", icon: "ti-adjustments", label: "Rules", parent: "Administration", parentIcon: "ti-users" }],
  ["/front/profile.php", { active: "users", href: "/front/profile.php", icon: "ti-user-check", label: "Profiles", parent: "Administration", parentIcon: "ti-users" }],
  ["/front/logs.php", { active: "users", href: "/front/logs.php", icon: "ti-list-details", label: "Logs", parent: "Administration", parentIcon: "ti-users" }],
  ["/Inventory/Configuration", { active: "central", href: "/Inventory/Configuration", icon: "ti-package-import", label: "Inventory", parent: "Setup", parentIcon: "ti-settings" }],
  ["/front/dropdown.php", { active: "central", href: "/front/dropdown.php", icon: "ti-list", label: "Dropdowns", parent: "Setup", parentIcon: "ti-settings" }],
  ["/front/devices.php", { active: "central", href: "/front/devices.php", icon: "ti-cpu", label: "Components", parent: "Setup", parentIcon: "ti-settings" }],
  ["/front/setup.notification.php", { active: "central", href: "/front/setup.notification.php", icon: "ti-bell", label: "Notifications", parent: "Setup", parentIcon: "ti-settings" }],
  ["/front/webhook.php", { active: "central", href: "/front/webhook.php", icon: "ti-webhook", label: "Webhooks", parent: "Setup", parentIcon: "ti-settings" }],
  ["/front/config.form.php", { active: "central", href: "/front/config.form.php", icon: "ti-settings", label: "General", parent: "Setup", parentIcon: "ti-settings" }],
  ["/front/plugin.php", { active: "central", href: "/front/plugin.php", icon: "ti-plug-connected", label: "Plugins", parent: "Setup", parentIcon: "ti-settings" }]
]);

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
