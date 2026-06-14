# Exact GLPI Compatibility Tracker

Rule for this fork: every modern feature must first check old/upstream GLPI and
match it exactly. Screens, workflows, labels, status values, priorities,
permissions, data shape, and styling should remain the same. Only the underlying
technology changes.

Do not redesign a GLPI module during migration. A visible or behavioral
difference is a compatibility bug unless it is explicitly approved as a later
change.

## Migration Checklist

| Old GLPI Area | Modern Module | Exact Compatibility Target | Difference Allowed | Status |
| --- | --- | --- | --- | --- |
| Service Asset and Configuration Management | Asset inventory | Asset records, ownership, status, site, relationships, GLPI item links | None | Started |
| Request Fulfillment | Service requests | Request creation, assignment, status tracking, forms, requester handling | None | Planned |
| Incident Management | Tickets | Incident creation, priority, lifecycle, linked assets, actors, categories | None | Started |
| Problem Management | Problems | Root cause records, linked incidents, follow-up | None | Planned |
| Change Management | Changes | Change planning, approval, implementation tracking | None | Planned |
| Knowledge Management | Knowledge base | Articles, FAQ, search, visibility | None | Planned |
| Contract Management | Contracts | Contract records, vendors, attached documents | None | Planned |
| Financial Management | Finance | Purchase, warranty, depreciation data | None | Planned |
| Asset Reservation | Reservations | Reservation requests, periods, availability | None | Planned |
| Data Center Infrastructure Management | DCIM | Racks, rooms, devices, links | None | Planned |
| Software and License Management | Licenses | Software inventory, license allocation, compliance | None | Planned |
| Impact Analysis | Impact graph | Related services and assets | None | Planned |
| Service Catalog and SLM | Catalog and SLA | Catalog entries, SLA targets, escalations | None | Planned |
| Entity Separation | Tenancy and RBAC | Entities, profiles, permissions | None | Planned |
| Project Management | Projects | Projects, tasks, progress | None | Planned |

## Definition Of Done

Each migrated module must include:

1. Old GLPI behavior notes with code or documentation references.
2. Modern API contract and UI workflow matching the old GLPI workflow.
3. Data migration notes from old tables to new storage.
4. Security review for authentication, authorization, validation, and audit logs.
5. Exact styling notes and old asset/template references.
6. Tests for domain rules and API errors.

## Current First Slice

The first modern slice is being converted from demo data to a real GLPI
compatibility layer:

- `GET /api/v1/assets`
- `GET /api/v1/tickets`
- `POST /api/v1/tickets`
- `GET /api/v1/users`
- `GET /api/v1/metrics`
- health checks at `/healthz` and `/readyz`

These routes must read and write the installed legacy GLPI database tables first.
The temporary modern-looking UI has been replaced for the first old routes with
GLPI's original static asset stack, generated CSS, shell classes, search card
classes, and ticket tab classes served by the Node runtime. Page coverage is tracked in
[`LEGACY_PAGE_INVENTORY.md`](LEGACY_PAGE_INVENTORY.md).

Current Node old-route coverage:

- `/` renders the GLPI anonymous login layout and posts to `/front/login.php`.
- `/front/central.php` renders in the GLPI vertical shell.
- `/front/ticket.php` renders a GLPI-style search page and table.
- `/front/ticket.form.php` supports create, update, trash, restore, and purge
  against the GLPI ticket tables.
- `/front/computer.php` and `/front/user.php` render GLPI-style search pages.
- The full local GLPI schema is captured in
  [`DATABASE_MIGRATION.md`](DATABASE_MIGRATION.md) and
  `modern/sql/glpi-legacy-schema.sql`; modern modules must map the old schema
  before adding any replacement schema.

Remaining first-slice gaps are full GLPI authentication/password validation,
full AJAX widgets, rich text/timeline behavior, saved searches, bulk actions,
permissions, and every GLPI module that has not yet been ported.
