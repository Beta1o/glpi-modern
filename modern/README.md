# GLPI Modern Runtime

This directory is the PHP replacement workspace for the GLPI fork.

The upstream PHP application remains in the repository as the reference
implementation. The new runtime is written in Go and must keep the existing
GLPI routes, database schema, styles, permissions, and user-visible behavior
until each module is proven equivalent.

## Run

```sh
cd modern
go run ./cmd/glpi
```

Default URL:

```text
http://127.0.0.1:8091/
```

Optional environment variables:

```text
GLPI_ADDR=127.0.0.1:8091
GLPI_LEGACY_ROOT=..
```

## Current Baseline

- Go HTTP server using the standard library.
- GLPI-compatible login, logout, health, and readiness routes.
- GLPI-styled shell for old `/front/*.php` routes.
- Static assets served from the upstream GLPI source tree.
- Full legacy schema snapshot at `modern/sql/glpi-legacy-schema.sql`.

## Migration Rule

Do not redesign or simplify behavior during the exact-copy phase. Port each PHP
module by matching routes, forms, create/update/delete flows, permissions,
database writes, and visible GLPI styling first. Enhancements come after
compatibility is verified.
