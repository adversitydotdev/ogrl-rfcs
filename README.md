# OGRL RFCs

Request for Comments specifications for **OGRL** (*Open GRC Language*).

## Specifications

- [RFC 0001: OGRL Object Model](rfcs/0001-object-model.md) — Graph object model, serialization, identifiers, graph constraints, and computed status.
- [RFC 0002: Tooling and Sources of Truth](rfcs/0002-tooling.md) — Authority boundaries, library pulls, mapping reviews, provider bundles, Git snapshots, restore, and OSCAL export.

## Local development

```bash
pnpm install
pnpm dev      # builds and serves on http://localhost:4173 with file watching
pnpm build    # generates static site in dist/
pnpm deploy   # builds and deploys to Cloudflare Workers (ogrl.adversity.dev)
```

The build compiles `rfcs/*.md` into static HTML under `dist/` (including raw Markdown copies at `dist/rfcs/*.md`) and verifies that every internal and cross-RFC anchor link resolves.

## AI assistance

These specifications and the site code were drafted and edited with help from AI tools (Anthropic Claude). The human author directs the design and is responsible for all content.

Review is still in progress. While an RFC has **Draft** status, its text may not have been fully human-reviewed yet. Treat it as a proposal and [open an issue](https://github.com/adversitydotdev/ogrl-rfcs/issues) for any errors. An RFC leaves Draft only after full human review of its normative content (object model, constraints, status semantics).
