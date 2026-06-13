# GLPI Modern

This is the first modernization branch for the GLPI fork. It keeps the upstream
GLPI history intact while starting a new service foundation under `modern/`.

## Stack

- Node.js 22+ with native TypeScript type stripping
- Zero runtime npm dependencies for the first service slice
- Static browser UI served by the API process
- PostgreSQL schema contract in `sql/001_initial.sql`
- Redis-ready environment contract for cache, queues, and distributed locks

This starting point favors a small trusted runtime surface. Frameworks can be
introduced later where they buy real leverage, but the first commit already has
secure headers, strict request limits, health checks, typed domain models, and a
stateless API shape.

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
curl http://127.0.0.1:8090/api/v1/metrics
```

## Migration Direction

1. Keep the existing PHP GLPI fork runnable while new bounded services are built.
2. Check the old GLPI workflow before replacing any feature, then match parity
   and add enhancements.
3. Track parity in [`docs/FEATURE_PARITY.md`](docs/FEATURE_PARITY.md).
4. Move high-traffic read paths first: assets, tickets, users, inventory events.
5. Put PostgreSQL behind repository interfaces and Redis behind cache/queue ports.
6. Add OpenID Connect, audit logging, and service-to-service authorization before
   exposing multi-user write flows.
7. Replace GLPI modules incrementally, with compatibility importers for legacy
   tables and attachments.

## Security Defaults

- No inline scripts or styles are required by the UI.
- The API sends a restrictive Content Security Policy and common hardening
  headers on every response.
- Request bodies are capped at 64 KB for this first slice.
- Unsupported methods and content types are rejected.
- Local demo data is in memory only; production credentials belong in runtime
  environment variables, never in git.
