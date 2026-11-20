# RFC 0002: Tooling and Sources of Truth

| Field | Value |
|---|---|
| Status | Draft |
| Spec version | 0.1.0 |
| Date | 2026-11-08 |
| Depends on | [RFC 0001](0001-object-model.md) |

While [RFC 0001](0001-object-model.md) defines the OGRL object model, an interoperable language only works if tools agree on where objects live, who owns each copy, and how data flows between Git, operational databases, external providers, and federal OSCAL exports. This RFC establishes those ownership boundaries and lifecycle contracts. Open design questions are collected in [Section 11](#11-open-questions).

## 1. Summary

An OGRL deployment separates authority cleanly across three domains:

1. **The OGRL repository** is the source of truth for the shared standard library—frameworks, requirements, standard controls, standard mappings, library baselines, and library tests. Organizations pull pinned revisions of this library forward into their own databases.
2. **Provider publications** are the source of truth for vendor-supplied control bundles—identifying a cloud or software service and the controls it inherits, shares, or delegates to customers (for instance, a Microsoft 365 responsibility matrix or the [CivicActions Django OSCAL component definition](https://github.com/CivicActions/oscal-component-definitions/tree/main/django)). Organizations import pinned revisions of these bundles without editing them.
3. **The organization's database** is the system of record for that organization's live security program—implementations, parameter values, test results, evidence metadata, policies, procedures, findings, risks, exceptions, and mapping reviews.

To keep programs portable and reviewable, a scheduled export job writes a one-way snapshot of the organization's database to a Git repository and can emit a full OSCAL package alongside it. Neither export is ever read back by a running deployment; the sole consumer of a Git snapshot is a one-time restore into an empty database ([Section 8.1](#81-restore)).

## 2. Copies and ownership

| Copy | Contents | Authoritative writer |
|---|---|---|
| OGRL repository | The shared standard library (`library/`). | The OGRL project via commits to the repository (including `ogrl import` for compiled NIST OSCAL catalogs). |
| Provider publication | A vendor's `party`, `component` definitions, and inherited/shared `implementation` statements. | The publishing provider; organizations import pinned revisions. |
| Organization database | A pinned projection of the standard library, pinned projections of imported provider bundles, and all organization-owned objects. | The OGRL platform: pulls replace the library projection, imports replace provider projections, and the API writes organization objects. |
| Organization Git repository | A periodic snapshot of organization objects plus manifest pins (and optional OSCAL renders). | The scheduled export job (one-way). |

YAML files in Git and JSON rows in the database represent the exact same OGRL objects—identical `id`, `modified`, and schema fields. Following RFC 0001, YAML is the human-readable authoring/snapshot form and canonical JSON is what the database persists. Any auxiliary columns an application maintains for indexing remain internal to the store unless serialized as standard fields or `extensions`.

Raw evidence blobs live in object storage (such as S3); both the database and Git snapshots store only the `evidence` metadata object containing `resource.uri` and its SHA-256 `resource.digest`.

<!-- figure: authority-flow -->

## 3. Standard library

The standard library consists of the library-side types defined in RFC 0001:

- `framework`
- `requirement`
- `mapping` published by OGRL
- `control` with `origin: standard`
- `baseline` published by OGRL
- `test` published by OGRL

A **library revision** is uniquely identified by the `version` on `bundle--ogrl-library` pinned to a specific Git commit of the OGRL repository, encompassing all files under `library/`.

Organization deployments treat the library projection as strictly read-only. Decisions an organization makes about library content—such as accepting or rejecting a draft mapping—are stored as separate organization objects so future library pulls can replace upstream rows cleanly without clobbering local judgment.

## 4. Organization database

Each organization's database is the authoritative runtime store for its security program and holds four categories of records:

- A **pinned projection of the standard library** at one commit and version.
- One **pinned projection per imported provider bundle** ([Section 7](#7-provider-bundles)), kept read-only.
- **Organization-owned objects:** `party`, `component`, `system`, `program`, `implementation`, `result`, `finding`, `evidence`, `policy`, `procedure`, `risk`, `exception`, custom controls (`origin: custom`), organization baselines, and organization tests. Any organization baseline using `extends_ref` dynamically tracks its library base across pulls.
- **Mapping reviews** recording organizational acceptance or rejection of library mappings ([Section 6](#6-mapping-reviews)).

Applications, UIs, and automated workflows read from and write to this database directly rather than committing to Git on every edit. Parameter values (`parameter_values` and `requirement_parameter_values`) live on organization `implementation` rows, so library pulls never overwrite them.

**Revision history and point-in-time evaluation.** The database retains every historical revision of every object it stores—not merely the latest state. Each revision records the full object body at a given `modified` timestamp, the actor who wrote it, and when it was stored, covering organization objects, library projections, provider projections, and active pins.

Evaluating compliance status at a past timestamp (`at`) reconstructs the graph strictly from the revisions and pins that were in force at that instant. A control marked `implemented` today does not retroactively turn green for an audit window last March.

The revision log also separates *origin* from *editorial history*: `created_by_ref` on an object identifies who originally authored it, while revision entries record subsequent edits—such as a human reviewer accepting an agent's draft. Revision logs are a property of the database rather than fields in the OGRL language; scheduled Git snapshots capture only current state, not full revision history.

## 5. Library pull

A pull advances an organization's database to a chosen revision of the standard library:

1. Read `bundle--ogrl-library` and all files under `library/` at the target commit.
2. Replace every stored library object matching an ID in the new revision wholesale (objects are replaced atomically, never field-merged).
3. Leave all organization-owned objects and all provider projections completely untouched—including implementations, parameter overrides, results, evidence, findings, and mapping reviews.
4. For any library ID present in the previous projection but absent from the new revision, keep the prior object body and mark it `revoked: true`, setting `modified` to the pull timestamp. This is the single case where RFC 0001 permits a non-producer store to advance `modified`, ensuring historical references never dangle.
5. Update the recorded library pin (`version` and commit hash).

**Atomicity and impact preview.** A pull is all-or-nothing: if interrupted before completion, the previous projection and pin remain intact.

Organizations decide when to pull. Even though a pull never edits an organization object, it can change computed status because status is evaluated against the pinned library—for example, when a newer revision adds a required test, introduces a control parameter, updates a mapping, or drops a control from a baseline. Before committing the new pin, the pull job evaluates every program at the same evaluation date against both the old and new revisions, reporting every control or requirement whose status changed alongside any mapping reviews rendered stale ([Section 6](#6-mapping-reviews)). Operators can also run this diff as a dry run before pulling.

## 6. Mapping reviews

Imported and newly authored library mappings arrive with `review_status: draft`. Because library rows are read-only, an organization records its acceptance or rejection in a separate `mapping_review` object rather than mutating the mapping:

```yaml
type: mapping_review
id: mapping_review--7c9e6679-7425-40de-944b-e07fc1f90ae7
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
mapping_ref: mapping--nist-sp-800-171-r3-03-01-01_to_nist-sp-800-53-r5-ac-2
library_version: 0.1.0
mapping_modified: 2026-10-22T11:30:00Z
review_status: reviewed          # reviewed | rejected
summary: >
  Accepted for the 2026 program. The requirement's account-management
  statements are covered by the access-control implementations.
```

`mapping_review` belongs to the closed set of types in RFC 0001, uses the standard envelope (with `name` optional), and is limited to at most one non-revoked review per organization per `mapping_ref`. When written, the platform records the pinned `library_version` and copies `mapping_modified` from the target mapping's current `modified` timestamp.

**Currency and staleness.** A review remains **current** only while `mapping_modified` matches the target mapping's `modified` timestamp. If a subsequent library pull modifies that mapping—say, changing `subset-of` to `equal-to`—the review becomes stale: it is retained for history but stops taking effect, returning the mapping to unreviewed status until a human reviews the new version. Stale rejections expire the same way, and reviews targeting a revoked mapping cease to apply.

<!-- figure: review-staleness -->

**Effect on coverage.** For an organization, a library mapping counts as reviewed when it has a current `mapping_review` with `review_status: reviewed` (while the underlying library row retains its own `review_status: draft` until OGRL upstream reviews it). Conversely, a current `mapping_review` with `review_status: rejected` excludes that mapping from the organization's coverage even if the library itself published it as `reviewed`. Combined sets from RFC 0001 count only when every member mapping is reviewed either upstream or via a current organizational `mapping_review`.

## 7. Provider bundles

A **provider bundle** allows a cloud or software vendor to publish a machine-readable description of its service and the controls customers inherit or share. It uses the standard RFC 0001 objects—no special type and no raw OSCAL authoring—while supporting lossless bidirectional bridging to OSCAL component definitions.

The vendor's publication is the source of truth; once imported, the organization's database holds a read-only projection. Any organization-authored implementations (including system-specific overrides of inherited controls) remain separate organization objects.

Illustrative provider bundle (not an actual vendor's published matrix):

```yaml
type: bundle
id: bundle--com.example.cloud-idp
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
name: Example Cloud IdP
version: "2026.11"
library:
  id: bundle--ogrl-library
  version: 0.1.0
```

```yaml
type: party
id: party--com.example
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
name: Example
kind: organization
```

```yaml
type: component
id: component--com.example.cloud-idp
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
name: Example Cloud IdP
kind: service
description: >
  Workforce identity service. The customer's tenant lives here.
party_ref: party--com.example
```

```yaml
type: implementation
id: implementation--com.example.cloud-idp-ogrl-ac-01
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
origin: provider
component_ref: component--com.example.cloud-idp
control_ref: control--ogrl-ac-01
status: implemented
responsibility: shared
narrative: >
  The service assigns one identity per person in the tenant and
  refuses a second active identity with the same employee id.
customer_responsibility: >
  The customer disables shared mailboxes used as logins and
  reviews guest accounts.
```

Providers mint IDs under their own domain prefix (never in the reserved standard-library slug namespace). `library.version` declares which OGRL library revision the bundle's `control_ref` links target; a provider addressing a NIST catalog directly (as imported OSCAL component definitions do) sets `requirement_ref` instead of `control_ref`.

**Inheritance semantics by `responsibility`:**

| `responsibility` | Meaning for the importing organization |
|---|---|
| `provider` | Fully inherited from the vendor. Unexpired evidence attached to the row (such as the vendor's SOC 2 or FedRAMP report) satisfies unfulfilled library tests. |
| `subservice` | Same as `provider`, with `subservice_ref` naming the underlying subservice party. |
| `shared` | Split responsibility: `narrative` documents the vendor's half and `customer_responsibility` documents the customer's. The control remains a `gap` until the customer authors a system implementation. |
| `customer` | The product can support the control, but implementation belongs entirely to the customer; the provider row alone never satisfies the control. |

Evidence shipped in a provider bundle uses `method: link` or `method: attestation` with a URI, digest, and `valid_until` matching the report's expiry (the artifact bytes remain with the provider). Any `test` in a provider bundle is descriptive only and carries no `run` block—a customer's harness never executes against a vendor's infrastructure.

<!-- figure: shared-responsibility -->

**Import workflow.** Importing a provider bundle makes its component available in the database without requiring immediate attachment to a system (attaching happens separately when the organization adds the component to `system.component_refs`):

1. Parse the bundle and reject it if `spec_version` is incompatible under RFC 0001 section 6.2, or if `library.version` is newer than the pinned library and any `control_ref` fails to resolve.
2. Replace every stored object belonging to this provider projection wholesale (no field merging).
3. Leave all organization objects, the library projection, and all other provider projections untouched.
4. Mark any provider ID present in the prior projection but missing from the new revision as `revoked: true` on its previous body so references stay intact.
5. Record the pin: bundle `id`, `version`, and commit hash or content digest.

Like library pulls, imports are atomic—an interrupted import leaves the previous projection and pin unchanged.

**OSCAL component definitions.** `ogrl import oscal-component` converts an OSCAL component definition (such as the Django component definition) into provider objects: the component's title and description become a `component`, parties become `party` objects, and each implemented requirement becomes a provider `implementation` whose `requirement_ref` resolves the OSCAL `control-id` against the pinned catalog (for example, `ac-3` → `requirement--nist-sp-800-53-r5-ac-3`) with its description copied into `narrative`.

`responsibility` is derived by first-match precedence:

| OSCAL source property | Mapped `responsibility` |
|---|---|
| Prop `provider: No`, or `control-origination` is `customer-configured` or `customer-provided` | `customer` |
| `control-origination` is `inherited`, `service-provider-corporate`, or `service-provider-system` | `provider` |
| `control-origination` is `shared`, or `security_control_type` is `Hybrid` | `shared` |
| Anything else | `shared` |

For example, the Django component definition marks its controls `Hybrid` and flags `AC-14` and `AU-2` with `provider: No`, so those two import as `customer` and the rest as `shared`. If the OSCAL description separates the customer's responsibility sentence, it populates `customer_responsibility`; otherwise the field is omitted (and the control still stays in `gap` until the customer implements its half). Object IDs preserve the upstream OSCAL UUIDs (`component--{uuid}`, `implementation--{uuid}`) so re-importing an updated revision replaces the same rows cleanly.

When exporting back to an OSCAL component definition, the mapping reverses: `provider` and `subservice` emit `inherited`, `shared` emits `shared`, and `customer` emits `customer-configured`, with both `narrative` and `customer_responsibility` written into the implemented-requirement description.

## 8. Git export

On a recurring schedule, the platform writes a snapshot of the organization's current objects to a Git repository controlled by the organization.

Each snapshot includes:

- Every organization-owned object listed in [Section 4](#4-organization-database), including `mapping_review` objects, plus policy and procedure document bodies beside their metadata objects.
- A bundle manifest pinning the active library version/commit and every imported provider bundle (the library's own object files are *not* duplicated here; they remain in the OGRL repository).
- A read-only copy of each imported provider projection under `provider/{bundle-remainder}/`, overwritten from the pin on every export.

```yaml
type: bundle
id: bundle--7c9e6679-7425-40de-944b-e07fc1f90ae7
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
name: Example organization
version: 2026-11-08T00:00:00Z
library:
  id: bundle--ogrl-library
  version: 0.1.0
  commit: f0de6d8d8c059d374f15e0ae07508d82e370fc1d
providers:
  - id: bundle--com.example.cloud-idp
    version: "2026.11"
    digest: sha-256:0000000000000000000000000000000000000000000000000000000000000000
```

Files follow RFC 0001's `{type}/{remainder}.yaml` convention and are serialized in deterministic canonical key order so diffs reflect genuine object changes rather than formatting churn.

**One-way push semantics.** The export job commits only when the tree actually changed and pushes to the configured remote without pulling, merging, or rebasing. If the remote contains commits the job did not produce, export halts and alerts operators that the repository has diverged; the platform never reads edits back from Git. Unowned files in the repository (such as a `README.md`) are left untouched, while hand edits to owned object files are overwritten on the next clean export.

Evidence blobs are never committed to Git—only their metadata objects with `resource.uri` and `resource.digest` appear in the snapshot so consumers can fetch and hash-verify blobs from object storage.

### 8.1 Restore

Because snapshots are how an organization exits a deployment or recovers from database loss, OGRL defines a strict **restore** path that loads a Git snapshot (at a specific commit) or an equivalent exchange-form bundle into an **empty** organization database.

Restore is a bootstrap operation, never a recurring sync: if the target database already contains any organization objects, restore must refuse to run.

1. Read the bundle manifest and reject incompatible `spec_version` values.
2. Pull the exact standard-library `version` and `commit` pinned in the manifest ([Section 5](#5-library-pull)).
3. Load each provider projection from the snapshot's `provider/` directory and verify it against the pinned digest—rejecting any mismatch—without contacting external providers.
4. Validate the entire combined graph (organization objects against the loaded library and provider projections) as a self-contained RFC 0001 bundle, rejecting the restore with the offending object ID on any dangling reference or constraint violation.
5. Persist every organization object verbatim, preserving `id`, `created`, `modified`, and `created_by_ref` untouched (restore is not a producer and must not advance `modified`).
6. Record the library and provider pins.

**Atomicity.** Nothing is committed to the database until step 4 succeeds for every object; any failure leaves the database empty.

**History limits.** Because snapshots store current objects rather than full database revision logs, revision history begins anew at the restore timestamp (attributed to whoever ran the restore). Queries for compliance status at an `at` timestamp predating the restore are refused rather than inaccurately computed against post-restore state; organizations needing historical audit playback retain database backups alongside Git snapshots.

**Artifact blobs.** After objects are persisted, restore resolves each `resource.uri`—reading relative paths from the snapshot and fetching absolute URIs—verifying digests and copying matching bytes into the new deployment's object storage. Missing or mismatched evidence blobs are retained and reported as incomplete under RFC 0001 (excluded from status until supplied). Policy and procedure bodies follow the same rule, which is why the export job writes them into the snapshot alongside their objects.

**Round-trip guarantee.** Restoring a snapshot into an empty database and immediately exporting it again must yield byte-identical canonical objects. Passing this round-trip check is the conformance bar for claiming true program portability.

## 9. OSCAL export

For federal and defense customers, OGRL renders a complete OSCAL 1.2.3 package (the same OSCAL version used by the imported NIST catalogs) from the organization database and pinned library for one `system` and one target NIST framework (such as `nist-sp-800-53-r5` or `nist-sp-800-171-r3`). Programs mapped to multiple NIST frameworks can be exported once per target. Each file is emitted in both JSON and XML with identical content.

Like Git snapshots, OSCAL packages are strictly read-only renders—editing exported OSCAL and re-importing it is out of scope. Both the scheduled Git export and on-demand downloads use the same renderer.

<!-- figure: oscal-fanout -->

| Output file | Contents |
|---|---|
| `oscal/profile.json` | Imports the upstream NIST catalog by its `framework.source` coordinates (`uri`, `path`, `commit`) without copying the catalog, selects in-scope requirements, and emits resolved `set-parameter` entries. |
| `oscal/ssp.json` | System Security Plan referencing the exported profile via `import-profile`. |
| `oscal/mapping-collection.json` | Crosswalk from OGRL controls (and other mapped requirements) to the target framework. |
| `oscal/component-definition.json` | Reusable component definitions for components included in the system. |
| `oscal/assessment-results.json` | System findings targeting objectives in the chosen framework. |
| `oscal/poam.json` | Plan of Action and Milestones combining open milestone-bearing risks, active exceptions, and `not-satisfied` findings in force. |

#### Projection rules by artifact

- **Profile:** Includes every non-withdrawn requirement in the program's effective baseline that has a mapping from an effective-baseline control with an active system or inherited component implementation. Emits `set-parameter` entries only for target parameters that resolve under RFC 0001; unresolved parameters are omitted.
- **SSP:** Populates system characteristics from `system` (`function` → description, `boundary` → authorization boundary, `information_types` → CIA categorizations, `component_refs` → OSCAL components, and `subservice` parties with `authorization` blocks → leveraged authorizations).
  - Active implementations evaluated under RFC 0001 section 8 project through mappings onto OSCAL `implemented-requirement` entries: system-only implementations populate `this-system`, component implementations populate their component statements, and system-specific component overrides replace inherited component statements for this system.
  - `control-id` mapping: for SP 800-53, lowercase `display_id` turning enhancement parentheses into dots (`AC-2` → `ac-2`, `AC-2(1)` → `ac-2.1`); for SP 800-171 Rev 3, prefix `SP_800_171_` (`03.01.01` → `SP_800_171_03.01.01`). Mapped statement parts become OSCAL `statement-id`s.
  - OSCAL `implementation-status` is derived from contributing implementations and mappings:

| Contributing implementations and mappings | OSCAL `implementation-status` |
|---|---|
| All implementations are `implemented` and all mappings are `equal-to`, `equivalent-to`, or `superset-of` | `implemented` |
| All implementations are `not-applicable` | `not-applicable` |
| At least one implementation is `planned`, and none is `implemented` or `partial` | `planned` |
| Anything else (including `exception`, `subset-of`, and `intersects-with`) | `partial` |

  - Requirement `remarks` capture each contributing implementation's parameter-resolved control statement, narrative, mapping relationship, organizational `mapping_review` status, any active exception's justification and expiry, and citations to relevant findings (findings alone do not alter `implementation-status`).
  - Resolved NIST organization-defined parameters (implementation override → baseline literal → `parameter_map`) emit `set-parameter` entries; unbound parameters remain unset rather than fabricated, while the resolved OGRL control statement still appears in `remarks`.
- **Mapping collection:** Emits one OSCAL mapping per library mapping targeting the chosen framework (`source`: OGRL control ID; `target`: OSCAL control ID plus optional `statement-id`), preserving `relationship`, `rationale`, `confidence`, and recording `review_status`, any organizational `mapping_review`, and `parameter_map` as OSCAL props, with provenance pinned to the library revision.
- **Component definition:** Covers `system.component_refs` using only generic component implementations (`component_ref` set, no `system_ref`), including imported provider rows. System-specific overrides stay in the SSP so the component definition remains portable across systems. `responsibility` maps to `control-origination` per [Section 7](#7-provider-bundles).
- **Assessment results:** Projects each system `finding` targeting the chosen framework onto an OSCAL finding (`satisfied` / `not-satisfied`), selecting the target OSCAL objective via `#obj.`, writing `narrative` as the observation, listing `evidence_refs` in back-matter by URI and SHA-256 digest, and carrying linked risks with their likelihood, impact, and treatment.
- **POA&M:** Emits one item per open risk that carries at least one milestone and references an in-scope control (using `milestones` as the schedule, closed by `done`), per open exception on an in-scope implementation (with justification and `expires`), and per `not-satisfied` finding in force (omitting findings superseded by a later `satisfied` finding, and linking `risk_ref` when present).

## 10. Tooling inventory

| Tool | Data flow | Implementation status |
|---|---|---|
| `ogrl import` | Upstream OSCAL catalogs → `library/` files in the OGRL repo | Built (emits statements, parts, parameters, and draft mappings; adding assessment objectives is next). Distinct from organization pulls. |
| Library pull | OGRL repo revision → organization database | Specified in [Section 5](#5-library-pull). |
| Application & API | Organization database ↔ UI and API clients | Application-specific; reads and writes organization objects only without mutating library or provider projections. |
| Export job | Organization database → organization Git repo | Specified in [Section 8](#8-git-export). |
| Restore | Organization snapshot → empty organization database | Specified in [Section 8.1](#81-restore). |
| OSCAL export | Organization database + pinned library → full OSCAL 1.2.3 package | Specified in [Section 9](#9-oscal-export); shared by Git export and direct downloads. |
| Provider import | Provider bundle or OSCAL component definition → organization database | Specified in [Section 7](#7-provider-bundles). |

The test harness from RFC 0001 executes `test.run` blocks and persists emitted `result` (including `objective_refs`) and `evidence` objects directly into the organization database without touching Git; the scheduled export job picks them up on its next cycle.

## 11. Open questions

1. **Naming `mapping_review`:** The type is named `mapping_review` rather than `review` to avoid colliding with audit engagements (which remain out of scope).
2. **Handling vanished library IDs:** Marking vanished IDs `revoked: true` on their prior body preserves referential integrity for existing implementations and reviews, whereas hard deletion would break historical graphs.
3. **Export repository granularity:** Defaulting to one export repository per organization keeps setup simple; splitting to one repository per system remains a straightforward future option for larger multi-program organizations.
