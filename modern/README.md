# GLPI Modern

This is the technology-migration branch for the GLPI fork. It keeps the upstream
GLPI history intact while replacing the runtime layer under `modern/`.

## Stack

- Node.js 22+ with native TypeScript type stripping
- MariaDB/MySQL access through `mysql2`
- Real GLPI database tables as the source of truth
- Static browser UI served by the API process while exact GLPI screens are ported

The migration target is exact GLPI compatibility. Screens, styles, labels,
workflow behavior, table semantics, and permissions should match upstream GLPI.
Technology changes are allowed; user-visible product differences are not.

## Run

```sh
cd modern
npm start
```

Open:

```text
http://127.0.0.1:8090/
```

Override bind settings when needed:

```sh
HOST=0.0.0.0 PORT=8090 npm start
```

## Verify

```sh
npm test
npm run check
curl -I http://127.0.0.1:8090/
curl http://127.0.0.1:8090/api/v1/users
curl http://127.0.0.1:8090/api/v1/tickets
curl http://127.0.0.1:8090/api/v1/metrics
```

## Migration Direction

1. Keep the existing PHP GLPI fork runnable while new bounded services are built.
2. Check old/upstream GLPI before replacing any feature.
3. Match old GLPI behavior and styling exactly.
4. Track exact compatibility in [`docs/FEATURE_PARITY.md`](docs/FEATURE_PARITY.md).
5. Track old routes in [`docs/LEGACY_PAGE_INVENTORY.md`](docs/LEGACY_PAGE_INVENTORY.md).
6. Replace GLPI modules incrementally only when the replacement can run the same
   workflow against the same legacy data.

## Security Defaults

- No inline scripts or styles are required by the UI.
- The API sends a restrictive Content Security Policy and common hardening
  headers on every response.
- Request bodies are capped at 64 KB for this first slice.
- Unsupported methods and content types are rejected.
- Database credentials come from `GLPI_LEGACY_DATABASE_URL`, `GLPI_DB_*`, or the
  existing ignored `config/config_db.php`; credentials must never be committed.
