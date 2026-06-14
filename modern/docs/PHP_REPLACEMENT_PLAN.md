# PHP Replacement Plan

## Phase 1: Go Runtime Foundation

- Go module under `modern/`.
- Standard-library HTTP server.
- GLPI-compatible login and route shell.
- Static GLPI assets served from the copied upstream source.
- Full GLPI schema snapshot stored in `modern/sql/glpi-legacy-schema.sql`.

## Phase 2: Exact Module Ports

Port modules one at a time, using old PHP behavior as the reference:

1. Authentication and sessions.
2. Tickets: list, create, update, trash, restore, purge, actors, timeline.
3. Users, profiles, entities, permissions.
4. Assets and inventory.
5. Problems, changes, planning, service catalog.
6. Management, tools, setup modules.

Each port must document:

- old PHP routes replaced;
- old GLPI tables read/written;
- create, modify, delete, restore, purge behavior;
- tests proving old constants and side effects.

## Phase 3: Hardening

- Strict password verification and session rotation.
- CSRF tokens for every form.
- Permission checks matching GLPI profiles and entities.
- Structured audit logging.
- Dependency review and security headers.
