# OGRL RFCs

Request for Comments specifications for **OGRL** (*Open GRC Language*).

## Specifications

- [RFC 0001: OGRL Object Model](rfcs/0001-object-model.md) — Graph object model, serialization, identifiers, graph constraints, and computed status.
- [RFC 0002: Tooling and Sources of Truth](rfcs/0002-tooling.md) — Authority boundaries, library pulls, mapping reviews, provider bundles, Git snapshots, restore, and OSCAL export.
- [RFC 0003: Application Architecture](rfcs/0003-application.md) — Python kernel, agent write gates, plugin ports, persistence, Next.js frontend, observability, and AWS topology.
- [RFC 0004: HTTP API](rfcs/0004-http-api.md) — Resource conventions, pagination, optimistic concurrency, jobs, errors, and operational workflows.

## Local development

```bash
pnpm install
pnpm dev      # builds and serves on http://localhost:4173 with file watching
pnpm build    # generates static site in dist/
```

The build compiles `rfcs/*.md` into static HTML under `dist/` (including raw Markdown copies at `dist/rfcs/*.md`) and verifies that every internal and cross-RFC anchor link resolves.
