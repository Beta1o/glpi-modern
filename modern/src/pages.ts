import type { Asset, GlpiUser, Metrics, Ticket } from "./store.ts";

type ShellOptions = {
  active: "central" | "tickets" | "assets" | "users";
  body: string;
  title: string;
};

const assetVersion = "9452863c0be58b3c03d0b692ee436b782ac6fa20";

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
      <div class="d-flex card-tabs flex-column flex-md-row vertical">
        <ul class="nav nav-tabs flex-row flex-md-column d-none d-md-block" id="tabspanel" style="min-width: 200px" role="tablist">
          ${ticketTab("Ticket", "ti-alert-circle", true)}
          ${ticketTab("Statistics", "ti-chart-pie")}
          ${ticketTab("Approvals", "ti-thumb-up")}
          ${ticketTab("Knowledge Base", "ti-lifebuoy")}
          ${ticketTab("Items", "ti-package")}
          ${ticketTab("Costs", "ti-wallet")}
          ${ticketTab("Projects", "ti-layout-kanban")}
          ${ticketTab("Historical", "ti-history")}
          ${ticketTab("All", "ti-list")}
        </ul>
        <select class="form-select border-2 rounded-0 rounded-top d-md-none mb-2" id="tabspanel-select">
          <option selected>Ticket</option>
          <option>Statistics</option>
          <option>Approvals</option>
          <option>Knowledge Base</option>
          <option>Items</option>
          <option>Costs</option>
          <option>Projects</option>
          <option>Historical</option>
          <option>All</option>
        </select>
        <div class="tab-content p-2 flex-grow-1 card border-start-0" style="min-height: 150px">
          <div class="tab-pane active show" role="tabpanel">
            ${renderTicketForm(ticket, users, isNew)}
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
        ${renderMainHeader(options.active)}
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
                ["Statistics", "/front/stat.php", "ti-chart-pie"]
              ]
            })}
            ${renderMenuGroup({
              key: "central",
              active,
              icon: "ti-briefcase",
              label: "Management",
              items: [
                ["Licenses", "/front/softwarelicense.php", "ti-certificate"],
                ["Budgets", "/front/budget.php", "ti-cash"],
                ["Suppliers", "/front/supplier.php", "ti-building-factory-2"],
                ["Contacts", "/front/contact.php", "ti-address-book"],
                ["Contracts", "/front/contract.php", "ti-file-description"],
                ["Documents", "/front/document.php", "ti-files"]
              ]
            })}
            ${renderMenuGroup({
              key: "central",
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
                ["Profiles", "/front/profile.php", "ti-user-check"],
                ["Logs", "/front/logs.php", "ti-list-details"]
              ]
            })}
            ${renderMenuGroup({
              key: "central",
              active,
              icon: "ti-settings",
              label: "Setup",
              items: [
                ["Dropdowns", "/front/dropdown.php", "ti-list"],
                ["Components", "/front/devices.php", "ti-cpu"],
                ["Notifications", "/front/setup.notification.php", "ti-bell"],
                ["Webhooks", "/front/webhook.php", "ti-webhook"],
                ["General", "/front/config.form.php", "ti-settings"]
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
  key: ShellOptions["active"];
  label: string;
}): string {
  const isActive = options.active === options.key;
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
      <i class="ti ${escapeAttr(icon)}"></i>
      <span class="text-wrap">${escapeHtml(label)}</span>
    </a>
  `;
}

function isActiveRoute(active: ShellOptions["active"], href: string): boolean {
  return (
    (active === "tickets" && href === "/front/ticket.php") ||
    (active === "assets" && href === "/front/computer.php") ||
    (active === "users" && href === "/front/user.php") ||
    (active === "central" && href === "/front/central.php")
  );
}

function renderMainHeader(active: ShellOptions["active"]): string {
  const current = pageInfo(active);
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

function pageInfo(active: ShellOptions["active"]): {
  href: string;
  icon: string;
  label: string;
  parent: string;
  parentIcon: string;
} {
  if (active === "tickets") {
    return { href: "/front/ticket.php", icon: "ti-alert-circle", label: "Tickets", parent: "Assistance", parentIcon: "ti-headset" };
  }
  if (active === "assets") {
    return { href: "/front/computer.php", icon: "ti-device-laptop", label: "Computers", parent: "Assets", parentIcon: "ti-package" };
  }
  if (active === "users") {
    return { href: "/front/user.php", icon: "ti-user", label: "Users", parent: "Administration", parentIcon: "ti-users" };
  }
  return { href: "/front/central.php", icon: "ti-dashboard", label: "Dashboard", parent: "", parentIcon: "" };
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
    <div class="search_page row" data-testid="search-page">
      <div class="card col-2 d-flex flex-column responsive-toggle d-none saved-searches-panel ${escapeAttr(itemClass)}">
        <div class="card-header d-flex flex-nowrap pe-0 align-items-center text-muted">
          <i class="ti ti-star"></i>&nbsp;
          <span class="text-truncate">Saved Searches</span>
          <li class="ms-auto btn-list me-1 flex-nowrap">
            <a href="/front/savedsearch.php" class="btn btn-sm btn-icon btn-ghost-secondary" title="Manage all saved searches"><i class="ti ti-settings"></i></a>
            <button class="btn btn-sm btn-icon btn-ghost-secondary ms-1 d-none d-md-block"><i class="ti ti-pinned"></i></button>
            <button class="btn btn-sm btn-icon btn-ghost-secondary ms-1"><i class="ti ti-x"></i></button>
          </li>
        </div>
      </div>
      <div class="col search-container">
        <div class="card search-card" data-testid="search-format-table">
          <div class="card-header search-header px-1 px-xl-3">
            <div class="search-controls d-flex justify-content-between align-items-center">
              <form name="searchform${escapeAttr(itemType)}" class="search-form-container needs-validation" method="get" action="/front/${itemClass}.php" data-glpi-search-form>
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
                      <div class="list-group list-group-flush list-group-hoverable criteria-list pt-2">
                        <div class="list-group-item p-2 border-0 normalcriteria">
                          <div class="row g-1 align-items-center">
                            <div class="col-auto"><select class="form-select" name="criteria[0][field]"><option selected>Status</option><option>Title</option><option>ID</option></select></div>
                            <div class="col-auto"><select class="form-select" name="criteria[0][searchtype]"><option selected>is</option></select></div>
                            <div class="col-auto"><select class="form-select" name="criteria[0][value]"><option selected>Not Solved</option><option>All</option></select></div>
                          </div>
                        </div>
                      </div>
                      <div class="card-footer">
                        <button class="btn btn-sm btn-primary" type="submit"><i class="ti ti-search"></i><span class="d-none d-sm-block">Search</span></button>
                        <a class="btn btn-sm btn-ghost-secondary" href="/front/${itemClass}.php?reset=reset">Reset</a>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
              <div class="btn-list">
                <a class="btn btn-sm btn-ghost-secondary" href="/front/report.dynamic.php?item_type=${escapeAttr(itemType)}&amp;display_type=2"><i class="ti ti-chart-pie"></i></a>
                <a class="btn btn-sm btn-ghost-secondary" href="/front/report.dynamic.php?item_type=${escapeAttr(itemType)}&amp;display_type=4"><i class="ti ti-map"></i></a>
                <button class="btn btn-sm btn-ghost-secondary show_displaypreference_modal"><i class="ti ti-columns-3"></i></button>
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
