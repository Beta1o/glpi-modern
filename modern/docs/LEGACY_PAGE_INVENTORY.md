# Legacy GLPI Page Inventory

Migration rule: do not mark a page complete until the Node implementation
matches the old GLPI page route, layout, styling, data fields, form behavior,
permissions, actions, tabs, AJAX behavior, and database side effects.

Actions are mandatory for parity. For each module, capture and reimplement:

- create form behavior
- modify/update behavior
- soft delete / trash behavior
- restore behavior when GLPI supports trash
- purge/permanent delete behavior when GLPI supports purge
- bulk actions from list pages
- AJAX tab loading and inline actions
- validation errors and permission failures

The running legacy app at `http://127.0.0.1:8080` is the reference source.
Captured reference pages from the current local install:

| Old route | Reference title | Current Node route | Status | Must match before done |
| --- | --- | --- | --- | --- |
| `/` | `Authentication - GLPI` | `/` | Not started | Login form, auth sources, CSRF/session behavior, logo, anonymous layout |
| `/front/central.php` | `Standard Interface - GLPI` | `/front/central.php` | Started | Full shell, menu tree, dashboard tabs, language/profile controls |
| `/front/ticket.php` | `Tickets - GLPI` | `/front/ticket.php` | Started | Search criteria, saved searches, result table, bulk actions, create links, trash/purge actions |
| `/front/ticket.form.php` | `Ticket - ... - GLPI` | `/front/ticket.form.php` | Started | Ticket form, actors, category, status, priority, rich text, timeline, tabs, update/delete/restore/purge |
| `/front/computer.php` | `Computers - GLPI` | `/front/computer.php` | Started | Asset search, filters, result columns, bulk actions, create/import links |
| `/front/user.php` | `Users - GLPI` | `/front/user.php` | Started | User search, filters, result columns, profiles/entity links |

## Shared Layout Requirements

- Use GLPI's existing public asset stack: `base.css`, `tabler.css`, `glpi.scss`,
  `core_palettes.scss`, `base.js`, `common.js`, Vue build assets, Tabler icons,
  and GLPI logos.
- Keep old menu labels and old URLs under `/front/...`.
- Keep old status, priority, ticket type, and actor constants exactly:
  - ticket status: `1 New`, `2 Assigned`, `3 Planned`, `4 Waiting`, `5 Solved`, `6 Closed`
  - priority: `1 Very low`, `2 Low`, `3 Medium`, `4 High`, `5 Very high`, `6 Major`
  - ticket type: `1 Incident`, `2 Request`
  - ticket actors: `1 Requester`, `2 Assigned to`, `3 Observer`

## Current Compatibility Work

- The Node API reads the real GLPI MariaDB database instead of demo data.
- `POST /api/v1/tickets` inserts into `glpi_tickets` and `glpi_tickets_users`.
- Ticket update/delete/restore/purge parity is required and being implemented
  against `glpi_tickets.is_deleted` and the legacy ticket row.
- `/front/central.php`, `/front/ticket.php`, `/front/ticket.form.php`,
  `/front/computer.php`, and `/front/user.php` are reserved in Node for migrated
  old-route pages.

## Not Done Yet

- Full old GLPI authentication/session behavior.
- Full old GLPI menu tree and tab system.
- Exact old search result widgets and saved-search behavior.
- Rich text/timeline behavior on ticket forms.
- Permissions/profile/entity enforcement.
- All non-ticket GLPI modules.
