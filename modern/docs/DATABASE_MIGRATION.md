# Database Migration Contract

The modern GLPI app must copy GLPI's full database shape before replacing
technology. Do not build a reduced schema for only the pages already migrated.

Current local GLPI schema snapshot:

- Database: `glpi`
- Tables: 442
- Columns: 4519
- Schema file: `modern/sql/glpi-legacy-schema.sql`
- Regeneration command: `modern/tools/export-glpi-schema.sh`

## Rules

1. Keep the old GLPI schema as the compatibility source of truth.
2. Every modern module must map from the old GLPI table and column names first.
3. Do not drop, rename, or simplify GLPI concepts during the exact-copy phase.
4. Add modern storage only after the old schema behavior is fully mapped and
   the compatibility layer proves the same create, modify, trash, restore, and
   purge side effects.
5. For migrated modules, document the old tables touched by reads and writes.

## Current Implemented Table Mapping

Tickets:

- `glpi_tickets`
- `glpi_tickets_users`
- `glpi_items_tickets`
- ticket purge cleanup tables listed in `modern/src/legacy-glpi-store.ts`

Users:

- `glpi_users`

Assets:

- `glpi_computers`
- `glpi_networkequipments`
- `glpi_printers`
- related user, state, and location lookup tables

The next database step is table-by-table mapping for every route exposed in the
GLPI menu, starting with the remaining assets and assistance modules.
