# Technology Decision

Recommended replacement for PHP in this fork: **Go backend with server-rendered
HTML and the existing GLPI MariaDB schema during the compatibility phase**.

Reasons:

- Fast compiled runtime with low memory overhead.
- Strong static typing and simple concurrency model.
- Small dependency surface when built on `net/http`.
- Good fit for secure server-side pages, forms, sessions, and audit-heavy ITSM
  workflows.
- Easy single-binary deployment after the migration is complete.

The old PHP source remains in the repository as the reference implementation
while modules are migrated. New runtime code lives under `modern/`.

## Compatibility Rules

1. Keep old GLPI routes such as `/front/ticket.php`.
2. Keep old GLPI database tables and side effects first.
3. Replace PHP module by module with Go handlers.
4. Do not redesign pages during the exact-copy phase.
5. Add security improvements after old behavior is proven equivalent.
