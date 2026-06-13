# Feature Parity And Enhancement Tracker

Rule for this fork: every modern feature must first check the old GLPI behavior,
preserve the useful workflow, then add measured improvements for security,
performance, usability, or scale.

Do not replace a GLPI module only because a new technology is available. Replace
it when the new version can cover the old workflow and improve the operator
experience.

## Migration Checklist

| Old GLPI Area | Modern Module | Parity Target | Enhancement Target | Status |
| --- | --- | --- | --- | --- |
| Service Asset and Configuration Management | Asset inventory | Asset records, ownership, status, site, relationships | Event-driven inventory updates, fast search, API-first imports | Started |
| Request Fulfillment | Service requests | Request creation, assignment, status tracking | Guided forms, queue automation, SLA-aware routing | Planned |
| Incident Management | Tickets | Incident creation, priority, lifecycle, linked assets | Low-latency ticket API, realtime updates, audit timeline | Started |
| Problem Management | Problems | Root cause records, linked incidents, follow-up | Incident clustering, trend detection, knowledge suggestions | Planned |
| Change Management | Changes | Change planning, approval, implementation tracking | Risk scoring, approval policies, deployment calendar hooks | Planned |
| Knowledge Management | Knowledge base | Articles, FAQ, search, visibility | Semantic search, version history, reuse analytics | Planned |
| Contract Management | Contracts | Contract records, vendors, attached documents | Renewal alerts, spend visibility, vendor risk signals | Planned |
| Financial Management | Finance | Purchase, warranty, depreciation data | Cost dashboards, lifecycle forecasts, budget exports | Planned |
| Asset Reservation | Reservations | Reservation requests, periods, availability | Conflict prevention, calendar sync, approval rules | Planned |
| Data Center Infrastructure Management | DCIM | Racks, rooms, devices, links | Topology graph, capacity planning, dependency mapping | Planned |
| Software and License Management | Licenses | Software inventory, license allocation, compliance | Usage-based compliance checks, optimization reports | Planned |
| Impact Analysis | Impact graph | Related services and assets | Blast-radius analysis, dependency scoring | Planned |
| Service Catalog and SLM | Catalog and SLA | Catalog entries, SLA targets, escalations | Policy engine, queue metrics, customer-facing status | Planned |
| Entity Separation | Tenancy and RBAC | Entities, profiles, permissions | Tenant isolation, least-privilege roles, scoped API tokens | Planned |
| Project Management | Projects | Projects, tasks, progress | Kanban/API automation, risk and dependency tracking | Planned |

## Definition Of Done

Each migrated module must include:

1. Old GLPI behavior notes with code or documentation references.
2. Modern API contract and UI workflow.
3. Data migration notes from old tables to new storage.
4. Security review for authentication, authorization, validation, and audit logs.
5. Performance target for common list, search, create, and update paths.
6. Tests for domain rules and API errors.

## Current First Slice

The first modern slice covers a small subset of assets and tickets:

- `GET /api/v1/assets`
- `GET /api/v1/tickets`
- `POST /api/v1/tickets`
- `GET /api/v1/metrics`
- health checks at `/healthz` and `/readyz`

Next work should compare these routes against the old GLPI ticket and asset
screens, then expand the model to match required fields, permissions, history,
and assignment behavior.
