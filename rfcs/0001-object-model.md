# RFC 0001: OGRL Object Model

| Field | Value |
|---|---|
| Status | Draft |
| Spec version | 0.1.0 |
| Date | 2026-11-08 |

This RFC defines **OGRL** (the *Open GRC Language*): the portable data model tools use to represent security controls, framework requirements, crosswalks, implementations, test results, evidence, policies, and risk.

This specification covers only the language itself. Storage ownership, library pulls, provider bundles, Git snapshots, and OSCAL export semantics are specified in [RFC 0002](0002-tooling.md); individual applications and APIs are separate implementations built on top of these specs. Because this document is a working draft, the design choices most likely to evolve during review are collected in [Section 13](#13-open-questions).

## 1. Summary

OGRL models a security program as a graph of typed objects. Humans author those objects as individual YAML files, and tools exchange collections of them as canonical JSON bundles. Higher-level artifacts—control catalogs, System Security Plans (SSPs), Plans of Action and Milestones (POA&Ms), and readiness dashboards—are not first-class document types; they are disposable views derived by walking the graph.

In spirit, OGRL plays the same role for governance, risk, and compliance that STIX plays for threat intelligence. Individual controls, mappings, or pieces of evidence can move between systems on their own, and a tool can implement only a subset of the model while remaining interoperable—provided it preserves any fields it does not understand.

OSCAL remains the bridge to NIST catalogs and federal authorization tooling. Teams author OGRL YAML rather than raw OSCAL: importers compile upstream OSCAL catalogs (including assessor objectives) into OGRL `requirement` objects, and renderers project a live OGRL graph out into an SSP, component definition, assessment results, and POA&M when a federal customer requires them.

## 2. Motivation

Most organizations run a single security program and account for it against multiple overlapping standards—SOC 2, ISO/IEC 27001, HIPAA, NIST SP 800-53, NIST SP 800-171, and CMMC all ask closely related questions under different identifiers. Commercial platforms like Vanta, Drata, and Secureframe absorb that overlap inside proprietary control libraries and private crosswalks. As a result, a company's program cannot cleanly leave its vendor, and two tools reading the same underlying evidence often disagree on what is compliant.

OGRL addresses that lock-in by publishing the control library, the crosswalk rules, and the status semantics in the open. Defining the language before building dashboards, connectors, or a self-hosted application guarantees that a control written by hand in Git, a control created through an API, and a control emitted by an automated collector all share the exact same shape.

NIST's OSCAL already models catalogs, profiles, mappings, and SSPs, and NIST publishes SP 800-53 Rev 5 and SP 800-171 Rev 3 in it. In practice, however, OSCAL is organized around monolithic documents: groups embed controls, controls embed parts, and an SSP bundles every narrative into a single file. Inspecting one control requires parsing an entire catalog; cross-references frequently rely on opaque UUIDs; and the authoring format carries a heavy layer of XML-derived `props` pairs. Tools built on OSCAL almost always invent a private object layer above it, which reintroduces the interoperability problem OSCAL was meant to solve.

STIX demonstrates a cleaner pattern: the atomic unit is a self-contained object with a `type`, a stable `id`, and a `modified` timestamp. Relationships that carry their own semantics live as independent objects, bundles are flat collections of objects, and documents are rendered views rather than sources of truth.

## 3. Goals

- **One shared object model** spanning both the public standard library and an organization's live security program.
- **Reviewable Git authoring** using one YAML file per object and readable prose.
- **Equivalent JSON wire format** so APIs, CLIs, and headless services can exchange the exact same model without needing a Git repository.
- **Honest crosswalks** that distinguish between full coverage and partial contribution rather than overstating alignment.
- **Deterministic status computation** so any two conforming implementations given the same bundle and evaluation timestamp arrive at the exact same control and requirement states.
- **Executable test methodologies** embedded on `test` objects so a separate test harness can run checks and emit `result` and `evidence` objects automatically.
- **Organization-level extensibility** for custom controls, policies, risks, and evidence without requiring a specification change.
- **First-class OSCAL interoperability** for importing NIST catalogs (including assessment objectives) and rendering federal packages (SSP, component definition, assessment results, and POA&M) without forcing humans to author OSCAL.

## 4. Non-goals

- **Application concerns:** UI design, vendor connectors, user accounts, and test-harness implementations are out of scope here. This RFC defines only the test-execution contract that a harness implements (see [Section 7.6](#76-test)).
- **Replacing OSCAL in federal authorization workflows:** OGRL compiles from and renders to OSCAL where federal tooling expects it.
- **Adjacent IT domains:** OGRL is not a CMDB, a full vendor-management system (beyond `party`), an issue tracker, a training LMS, or an audit-engagement workflow tool.
- **Republishing copyrighted standards text:** AICPA Trust Services Criteria and ISO/IEC 27001 prose are not distributed in the library (see [Section 10](#10-external-catalogs-and-copyright)).
- **Automatic transitive mappings:** If A maps to B and B maps to C, OGRL never infers a relationship between A and C; a reviewer must explicitly author or approve a direct mapping.

## 5. Principles

**The object is the atomic unit.** Catalogs are queries over `control` and `requirement` objects, and SSPs are rendered projections of a `system`, a `program`, and its `implementation` objects. The graph itself is the sole source of truth.

**The ID is the address.** References always use object identifiers—never file paths, and never inline copies of the target object.

**Relationships follow three clear placement rules.** Rather than turning every link into a standalone edge object (which makes human authoring tedious) or stuffing everything into one document (which makes versioning brittle), OGRL places each kind of relationship where its lifecycle belongs:

| Kind of relationship | Where it lives | Examples |
|---|---|---|
| Intrinsic to the authoring object | An inline `_ref` / `_refs` field on that object | A `test` names its `control_ref`; a `policy` names the `control_refs` it governs. |
| A crosswalk with semantics and rationale | A standalone `mapping` object | `OGRL-AC-01` intersects `CC6.1`. |
| Operational state with its own lifecycle | Its own object | How the production system carries out `OGRL-AC-01`. |

Because of this split, a `control` file never embeds external framework IDs: mappings evolve whenever a framework publishes a new revision, while controls evolve only when the underlying security practice changes.

**OGRL controls describe practices; imported requirements preserve statutory structure.** An OGRL `control` captures a single operational practice with a `summary`, `statement`, one-sentence `objective` (its success condition), and informative `guidance`. External `requirement` objects preserve the publisher's lettered `parts`—because NIST AC-2(a) and AC-2(g) represent distinct obligations—along with the assessor's `objectives`, which are distinct from a control's operational objective.

**Status is always computed, never stored.** Objects record observations, narratives, results, and expiration dates. No object stores a precomputed "compliant" flag.

**Unknown fields survive round trips.** A conforming tool that encounters unrecognized fields or extension keys must preserve them unchanged when writing the object back out. Only an object's producer may advance `modified`, with one narrow exception: a store maintaining a downstream projection of another party's publication may set `revoked: true` on an ID that disappears from a newer release, advancing `modified` to the time of the pull to record that the upstream producer no longer speaks for that ID.

## 6. Serialization and identity

### 6.1 YAML and JSON

OGRL uses **YAML 1.2** as its human authoring format and **Canonical JSON** (RFC 8785, JSON Canonicalization Scheme) as its wire, hashing, and comparison format. Because YAML 1.2 is a strict superset of JSON, any JSON bundle is also valid YAML. Both timestamps and calendar dates serialize as JSON strings.

Files authored in YAML follow these conventions:

- Store one object per file using two-space indentation.
- Use folded block scalars (`>`) for multi-line prose.
- Do not use YAML anchors, aliases, or merge keys.
- Omit fields that have no value; explicit `null` values are invalid.
- Comments are non-normative and are stripped in canonical JSON form.
- Format timestamps as UTC RFC 3339 strings (`2026-11-08T00:00:00Z`), and calendar dates as `YYYY-MM-DD` (`2026-11-08`) for expiry, adoption, and review dates.

### 6.2 Common envelope

Every OGRL object carries a shared envelope:

| Field | Required | Meaning |
|---|---|---|
| `type` | Yes | One of the closed set of object types defined in [Section 7](#7-types). |
| `id` | Yes | Globally unique identifier (see [Section 6.3](#63-identifiers)). |
| `spec_version` | Yes | OGRL specification version. This RFC defines `0.1.0`. |
| `created` | Yes | UTC timestamp when this ID was originally minted. Immutable. |
| `modified` | Yes | UTC timestamp when the producer last altered any field. Each revision uses the same `id` with a strictly later `modified` (using fractional seconds if multiple writes occur within the same second). |
| `name` | Yes, except `mapping`, `mapping_review`, `implementation`, `result`, and `exception` | Human-readable title. The five excepted types are naturally identified by their references, though they may still include a `name`. |
| `revoked` | No | Defaults to `false`. Once revoked, an ID is never reused. |
| `created_by_ref` | No | `party` ID of the producer that authored the object. |
| `tags` | No | List of free-form string tags. |
| `external_references` | No | Citations; each entry may carry `source`, `url`, and `description`. |
| `extensions` | No | Map of vendor or organization extension objects keyed by the owner's domain name. |
| `lang` | No | BCP 47 language tag. Defaults to `en`. |

**Versioning rules.** `spec_version` tracks the OGRL language specification, whereas a bundle's `version` tracks a content release of a library or provider catalog; the two evolve independently. Every object within a single bundle must share the same `spec_version` (mixing language versions in one bundle is out of scope for `0.1.0`).

`spec_version` follows `major.minor.patch`:

- **Patch** releases clarify prose without altering object schemas.
- **Minor** releases may add optional fields, enum values, or new object types (which become part of the closed type set from that release onward).
- **Major** releases may remove or redefine existing fields or semantics. While the major version is `0`, a minor release may also introduce breaking changes and will note them explicitly.

A conforming reader accepts any object whose `major.minor` matches a version it implements, regardless of `patch`, and rejects any other version rather than guessing.

### 6.3 Identifiers

Every object identifier has the syntax `type--remainder`, split on the first `--`:

- `type` consists of lowercase ASCII letters and underscores.
- `remainder` consists of lowercase ASCII letters, ASCII digits, hyphens (`-`), dots (`.`), and underscores (`_`). It must start and end with a letter or digit and must not contain `--`.
- Dots appear where an upstream identifier or reverse-domain namespace uses them (such as `cc6.1` or `com.acme`).
- Underscores appear only in the `_to_` and `_part_` joins of derived mapping IDs.

Every character permitted in an OGRL ID is safe in both file paths and URL path segments.

Two namespaces exist for minting IDs:

- **Standard library:** Human-readable slugs minted and permanently reserved by the OGRL project (for example, `control--ogrl-ac-01` or `requirement--soc2-tsc-2017-cc6.1`).
- **Organizations and providers:** Either a UUID or a slug prefixed with a domain the issuer controls (for example, `control--com.acme.badge-access`). Bare unprefixed slugs like `control--ac-01` are reserved exclusively for the standard library.

**Display IDs.** User interfaces present `display_id` rather than raw object IDs: `OGRL-AC-01`, `CC6.1`, `AC-2`, `AC-2(1)`, `3.1.1`, `A.5.15`. Official punctuation, parentheses, spaces, and uppercase letters live in `display_id` (and optionally in `citation` on a requirement), while the object ID stays normalized—so NIST `AC-2(1)` becomes `ac-2-1` in its slug.

**Derived mapping IDs.** Standard-library mappings derive their IDs from their endpoints so each pair corresponds deterministically to one file (dots inside a part ID become hyphens after `_part_`):

```text
mapping--ogrl-ac-01_to_soc2-tsc-2017-cc6.1
mapping--ogrl-ac-01_to_nist-sp-800-53-r5-ac-2_part_a
```

Organization-authored mappings use UUIDs or domain-prefixed slugs like any other organization object; the uniqueness rule in [Section 7.20](#720-graph-constraints) enforces one mapping per pair without relying on derived IDs.

**Sub-requirement fragments.** References can target specific parts or assessment objectives inside a requirement using URI-style fragments:

- Statement part: `requirement--nist-sp-800-53-r5-ac-2#a`
- Assessment objective: `requirement--nist-sp-800-53-r5-ac-2#obj.a`

Fragments belong strictly to the reference, never to the requirement's own `id`.

<!-- figure: id-anatomy -->

### 6.4 References

Fields ending in `_ref` hold a single ID, and fields ending in `_refs` hold an unordered list of IDs. A dangling reference is a validation error in a self-contained bundle and a warning when a tool intentionally loads a partial graph.

### 6.5 Bundles

A `bundle` packages a set of objects in one of two equivalent forms:

- **Repository form:** A `bundle.yaml` manifest describes the collection without an `objects` field, and tools discover sibling object files by scanning the directory tree.
- **Exchange form:** The same manifest inlines every object in an `objects` array, producing a single JSON or YAML payload suitable for HTTP transport or cryptographic signing.

Repository form:

```yaml
type: bundle
id: bundle--ogrl-library
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
name: OGRL Control Library
version: 0.1.0
```

Exchange form:

```yaml
type: bundle
id: bundle--ogrl-library
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
name: OGRL Control Library
version: 0.1.0
objects:
  - type: control
    id: control--ogrl-ac-01
    spec_version: 0.1.0
    # remaining fields of each object
```

When storing one object per file, the conventional path is `{type}/{remainder}.yaml` (so `control--ogrl-ac-01` lives at `control/ogrl-ac-01.yaml`). This layout is a convention rather than a requirement: the `id` inside the file is normative, and an object remains valid regardless of where it is stored.

## 7. Types

OGRL defines a closed set of object types. Adding new controls, risks, or policies creates new instances of existing types; introducing a new type requires a new `spec_version`.

| Type | Question it answers | Side |
|---|---|---|
| `framework` | Which publication and revision are we referencing? | Library |
| `requirement` | What specific obligation does that publication impose? | Library |
| `control` | What concrete practice do we implement and test? | Library or organization |
| `mapping` | How does a control or requirement relate to a target requirement? | Library or organization |
| `baseline` | Which controls and requirements define a program's scope? | Library or organization |
| `test` | How do we repeatedly verify a control? | Library or organization |
| `party` | Who owns, operates, or approves this? | Organization |
| `component` | What reusable piece of the boundary carries practices? | Organization |
| `system` | What is inside the authorization or audit boundary? | Organization |
| `program` | Which baseline is a given system pursuing? | Organization |
| `implementation` | How does a system or component carry out a control? | Organization |
| `result` | What happened the last time a test ran? | Organization |
| `finding` | What did an assessor determine about a specific objective? | Organization |
| `evidence` | What artifact supports a claim, and until when is it valid? | Organization |
| `policy` | What has the organization formally mandated? | Organization |
| `procedure` | What documented steps do people follow? | Organization |
| `risk` | What could go wrong, and how is it being treated? | Organization |
| `exception` | Where is a control formally waived, and when does the waiver expire? | Organization |
| `mapping_review` | Does this organization accept or reject a mapping it did not author? | Organization |

`mapping_review` is specified in [RFC 0002](0002-tooling.md#6-mapping-reviews) alongside the library pull workflow it supports.

A conforming library reader needs to implement only the library types, whereas a full GRC application implements the operational types as well (see [Section 11](#11-conformance)). SHA-256 digest values shown in the examples below are placeholders.

<!-- figure: object-graph -->

### 7.1 `framework`

A `framework` identifies an external standard or regulatory publication at a specific revision.

```yaml
type: framework
id: framework--nist-sp-800-53-r5
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
name: NIST SP 800-53 Revision 5
publisher: NIST
version: "5.2.0"
reproduction: permitted            # permitted | citation-only
source:
  format: oscal-catalog
  uri: https://github.com/usnistgov/oscal-content
  path: nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json
```

`reproduction` controls how much upstream text the library carries. Frameworks marked `citation-only` (such as SOC 2 and ISO/IEC 27001) store identifiers, citations, and OGRL-authored titles without republishing copyrighted prose. Public-domain sources such as NIST publications and the Code of Federal Regulations use `permitted`.

### 7.2 `requirement`

A `requirement` represents a single external obligation within a framework. Control enhancements (such as NIST `AC-2(1)`) are modeled as standalone requirements because publishers revise and withdraw them independently, while lettered clauses inside a requirement live under `parts`.

Citation-only requirement example:

```yaml
type: requirement
id: requirement--soc2-tsc-2017-cc6.1
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
display_id: CC6.1
name: Logical access security software, infrastructure, and architectures
framework_ref: framework--soc2-tsc-2017
class: criterion                   # criterion | control | enhancement | clause | specification
external_references:
  - source: AICPA
    description: 2017 Trust Services Criteria, CC6.1
```

Full-text requirement example (abridged; the imported AC-2 carries ten parameters and parts `a` through `l`):

```yaml
type: requirement
id: requirement--nist-sp-800-53-r5-ac-2
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
display_id: AC-2
name: Account Management
framework_ref: framework--nist-sp-800-53-r5
class: control
parameters:
  ac_02_odp_10:
    label: frequency
parts:
  - id: a
    statement: >
      Define and document the types of accounts allowed and
      specifically prohibited for use within the system;
  - id: j
    statement: >
      Review accounts for compliance with account management
      requirements {{ ac_02_odp_10 }};
```

**`class`** records the publisher's taxonomy (a SOC 2 `criterion`, NIST `control` or `enhancement`, ISO `clause`, or HIPAA `specification`) for display and export; it does not alter mapping semantics.

**Withdrawn vs. revoked.** Setting `withdrawn: true` (default `false`) records that the upstream publisher retired the obligation—for example, when NIST withdrew AC-13 and folded it into AC-2 and AU-6. A withdrawn requirement remains a valid object so historical crosswalks and findings still resolve, and outgoing mappings that document where the publisher relocated the obligation stay intact, but it carries no active obligation: it cannot appear in a baseline's `requirement_refs`, is excluded from requirement coverage, and typically omits `statement`.

By contrast, `revoked: true` on the common envelope is the object producer's statement that the ID itself was published in error or removed from the library. A library pull that sees an ID disappear sets `revoked`, never `withdrawn`.

**Assessment objectives.** The optional `objectives` list captures the assessor's evaluation questions (as published in NIST SP 800-53A and SP 800-171A). Each objective ID is local to its requirement and referenced via the `#obj.` fragment defined in [Section 6.3](#63-identifiers):

```yaml
objectives:
  - id: a
    statement: >
      Determine if the types of accounts allowed for use within
      the system are defined and documented.
    methods:
      - method: examine          # examine | interview | test
        statement: Account management policy.
      - method: interview
        statement: Personnel with account management responsibilities.
```

Each entry's `methods` list is optional and purely descriptive; test harnesses never execute `methods`. Automated or manual checks that satisfy an assessment objective reference it explicitly via `objective_refs` on a `test` (see [Section 7.6](#76-test)).

### 7.3 `control`

A `control` defines a single auditable security practice—scoped so one team can implement it and an auditor can verify it with one consistent evidence pattern.

`statement` and `objective` are normative; `guidance` is informative and may be ignored by tools. Parameter placeholders take the form `{{ parameter_name }}` with no expressions or formatting syntax inside the braces. Controls published by the OGRL project set `origin: standard`; organization-authored controls set `origin: custom`.

```yaml
type: control
id: control--ogrl-ac-01
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
display_id: OGRL-AC-01
name: Unique identities
origin: standard                   # standard | custom
family: ac
control_type: preventive           # preventive | detective | corrective
frequency: continuous              # continuous | daily | weekly | monthly | quarterly | annual | event-driven
summary: >
  Every person and every service account has its own identity.
statement: >
  The organization assigns a unique identity to each workforce
  user and each service account. Shared credentials are prohibited
  unless inventoried, owned, and approved, and the inventory is
  reviewed {{ shared_account_review }}.
objective: >
  Every active account can be traced to one owner, and every
  approved shared account appears on the inventory.
guidance: >
  Workforce users live in the IdP. Service accounts are owned by
  a team. Break-glass credentials count as shared accounts.
parameters:
  shared_account_review:
    label: how often shared accounts are reviewed
    value: quarterly
```

**Parameter resolution.** Control parameter values resolve in precedence order, highest first:

1. `implementation.parameter_values`
2. `baseline.parameter_bindings` for the active program
3. `control.parameters[].value` (the control's built-in default)

If any parameter referenced in a control's `statement` remains unset after resolution, the control cannot be `met` for that program. This is enforced as a computed-status rule ([Section 8](#8-computed-status)) rather than a write-time constraint on `implementation`, because a single implementation may serve multiple programs whose baselines supply different parameter bindings.

`frequency` describes how often the underlying practice operates and does not affect status computation; check cadence is governed by `interval` on each `test`. Target-framework parameters (such as NIST organization-defined parameters) resolve separately through `parameter_map` bindings on mappings ([Section 7.4](#74-mapping)); if a binding does not resolve, OSCAL exports leave the NIST parameter unset.

**Standard control families.** Controls with `origin: standard` use the following family codes and zero-padded display IDs in the format `OGRL-{FAMILY}-{NN}` (for example, `OGRL-AC-01` → `control--ogrl-ac-01`). Numbers are never reused within a family.

| `family` | Domain |
|---|---|
| `gv` | Governance, policies, roles, oversight, compliance calendar |
| `rm` | Risk assessment and risk treatment |
| `am` | Asset, system, and data ownership |
| `hr` | Workforce lifecycle, hiring, termination, responsibility |
| `ac` | Identity, access control, least privilege, reviews, revocation |
| `cm` | Change and configuration management |
| `sd` | Secure development and release engineering |
| `lm` | Logging, monitoring, alerting, time synchronization |
| `ir` | Incident response, forensics, notification |
| `vm` | Vulnerability scanning, patching, endpoint hardening |
| `cr` | Cryptography, data retention, disposal |
| `tp` | Third-party vendors and subservice organizations |
| `bc` | Backup, disaster recovery, capacity |
| `ps` | Physical security, facilities, media |

Custom controls may use any of these family codes or define their own. The initial standard library targets 80–120 controls covering SOC 2 Security, Availability, Confidentiality, and Processing Integrity, with Privacy planned as a subsequent family.

### 7.4 `mapping`

A `mapping` is the sole mechanism for crosswalks in OGRL. `source_ref` points to either a `control` or a `requirement`, and `target_ref` points to a `requirement` (optionally narrowed with a `#part` fragment).

```yaml
type: mapping
id: mapping--ogrl-ac-01_to_soc2-tsc-2017-cc6.1
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
source_ref: control--ogrl-ac-01
target_ref: requirement--soc2-tsc-2017-cc6.1
relationship: intersects-with
rationale: functional
review_status: reviewed
confidence: high
summary: >
  Unique identities are necessary for CC6.1. Removal, reviews,
  and authentication are other controls.
```

Targeting a specific statement part:

```yaml
type: mapping
id: mapping--ogrl-ac-01_to_nist-sp-800-53-r5-ac-2_part_a
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
source_ref: control--ogrl-ac-01
target_ref: requirement--nist-sp-800-53-r5-ac-2#a
relationship: subset-of
rationale: functional
review_status: reviewed
summary: >
  Covers identification of account types and owners.
  Review of accounts is a different control.
```

**Relationship vocabulary.** OGRL adopts the OSCAL mapping relationship vocabulary, always read from `source_ref` relative to `target_ref` (so `subset-of` from `control--ogrl-ac-01` to `AC-2#a` means the control covers only part of `AC-2(a)`):

| `relationship` | Meaning |
|---|---|
| `equal-to` | Identical obligation; wording differences do not change meaning. |
| `equivalent-to` | Effectively the same obligation expressed in different terms. |
| `subset-of` | The source is narrower than the target; unmet obligation remains on the target. |
| `superset-of` | The source covers the entire target plus additional scope. |
| `intersects-with` | Meaningful overlap, with uncovered scope on both sides. |
| `no-relationship` | Explicitly reviewed and confirmed unrelated, preventing automated re-imports from re-proposing it. |

**Rationale and review state.** `rationale` documents the basis for the relationship:

| `rationale` | Meaning |
|---|---|
| `functional` | Based on what implementing the source actually achieves operationally (default for OGRL library mappings). |
| `semantic` | Based on textual equivalence of meaning (typical of imported NIST crosswalks). |
| `syntactic` | Based on direct textual matching. |

`review_status` is either `draft` or `reviewed`; customer-facing coverage claims use `reviewed` mappings exclusively. `confidence` (`low`, `medium`, or `high`) is optional.

Coverage is derived directly from `relationship` rather than stored in a separate field, making contradictions impossible: `equal-to`, `equivalent-to`, and `superset-of` provide full coverage of the cited target (whole requirement or named part), whereas `subset-of` and `intersects-with` count as partial contributions.

**Combined coverage (`combined_with_refs`).** Because practice-sized controls are deliberately narrower than broad regulatory requirements, most accurate individual mappings are `subset-of` or `intersects-with`. When a reviewer determines that a group of controls collectively satisfies a target with nothing left over, they record that claim on one mapping in the group via `combined_with_refs`:

```yaml
type: mapping
id: mapping--ogrl-ac-01_to_nist-sp-800-53-r5-ac-2_part_a
source_ref: control--ogrl-ac-01
target_ref: requirement--nist-sp-800-53-r5-ac-2#a
relationship: subset-of
review_status: reviewed
combined_with_refs:
  - mapping--ogrl-ac-02_to_nist-sp-800-53-r5-ac-2_part_a
```

The mapping carrying `combined_with_refs` together with all referenced mappings forms a **combined set** asserting that their sources, taken jointly, are `equal-to` or `superset-of` the target. Every member must share the same `target_ref`, have a `control` as its `source_ref`, and carry `subset-of` or `intersects-with`. Each member retains its own individual `relationship` (so viewed alone it still reports as a contribution), and the combined set counts toward coverage only when every member is reviewed (see [Section 8](#8-computed-status)).

<!-- figure: mapping-relationships -->

**Requirement-to-requirement mappings.** Official upstream crosswalks (such as SP 800-171 Rev 2 to SP 800-53) use the same `mapping` type with a `requirement` as `source_ref`. They serve as reference material for crosswalk authors and are never composed transitively into control coverage claims.

**Parameter bindings (`parameter_map`).** When a target requirement contains organization-defined parameters, the mapping whose target uses each parameter can bind that parameter key to a parameter name on the source control:

```yaml
# on mapping--ogrl-ac-04_to_nist-sp-800-53-r5-ac-2_part_j
parameter_map:
  ac_02_odp_10: access_review_frequency
```

Target requirement parameters resolve in precedence order, highest first:

1. `implementation.requirement_parameter_values` on the evaluated implementation of the source control ([Section 7.11](#711-implementation))
2. `baseline.parameter_bindings` keyed by the target requirement ID ([Section 7.5](#75-baseline))
3. The resolved value of the control parameter named in `parameter_map`

If two non-revoked mappings from controls in the same program bind the same target parameter to different control parameters, the binding is treated as a conflict error and the target parameter stays unset. If no override, baseline literal, or `parameter_map` entry exists, the parameter remains unset—exporters never fabricate defaults.

<!-- figure: parameter-precedence -->

### 7.5 `baseline`

A `baseline` defines the scope of a compliance program: the frameworks in scope, the specific requirements judged, the controls implemented, and any program-level parameter bindings.

```yaml
type: baseline
id: baseline--soc2-s-a-c-pi
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
name: SOC 2 Security, Availability, Confidentiality, and Processing Integrity
framework_refs:
  - framework--soc2-tsc-2017
control_refs:
  - control--ogrl-ac-01
parameter_bindings:
  control--ogrl-ac-01:
    shared_account_review: quarterly
  requirement--nist-sp-800-53-r5-ac-2:
    ac_02_odp_01: manager approval and a documented business need
```

**Parameter bindings.** Entries in `parameter_bindings` keyed by a control ID supply control-level parameter defaults (overridden by `implementation.parameter_values`). Entries keyed by a requirement ID supply literal values for target-framework parameters (taking precedence over `mapping.parameter_map`, but overridden by `implementation.requirement_parameter_values`).

**Selecting requirements (`requirement_refs`).** Each entry in `requirement_refs` must be a whole requirement ID without a fragment, belonging to one of the baseline's `framework_refs`, and must not be withdrawn. When `requirement_refs` is omitted, the baseline automatically includes every non-revoked, non-withdrawn requirement across its `framework_refs`. Partial catalog selections—such as SP 800-53B Moderate or CMMC Level 2's 110 SP 800-171 Rev 2 requirements—list their exact `requirement_refs` explicitly. Requirement coverage in [Section 8](#8-computed-status) evaluates only this set, ensuring out-of-scope catalog items never surface as unmapped noise.

A baseline may list requirements with no `control_refs` (for example, when bootstrapping a newly imported catalog); every requirement in it simply reports as `unmapped` until controls and reviewed mappings exist.

**Extending a baseline (`extends_ref`).** Organizations typically tailor a library baseline rather than duplicating it by referencing it via `extends_ref`:

```yaml
type: baseline
id: baseline--com.acme.soc2-2026
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
name: Acme SOC 2, with badge access
extends_ref: baseline--soc2-s-a-c-pi
control_refs:
  - control--com.acme.badge-access
parameter_bindings:
  control--ogrl-ac-01:
    shared_account_review: monthly
```

Inheritance is limited to a single level: the target of `extends_ref` must not itself set `extends_ref`. A program always evaluates the **effective baseline**, computed as follows:

- `control_refs`: union of the base baseline's controls and this baseline's controls.
- `framework_refs`: union of the base baseline's frameworks and this baseline's frameworks.
- Requirements: union of the base baseline's resolved requirements and this baseline's resolved requirements (a child baseline that specifies neither `framework_refs` nor `requirement_refs` adds no new requirements).
- `parameter_bindings`: merged key by key, with the child baseline taking precedence.

A baseline without `extends_ref` is its own effective baseline. Because `extends_ref` references the base dynamically, pulling a library update automatically updates every extending organization baseline without modifying organization-owned objects.

Extensions are strictly additive. If an organization considers a standard control inapplicable, it keeps the control on the baseline and records an implementation with `status: not-applicable` and a justification in `narrative`, preserving audit visibility. An organization needing a strict subset of a framework's requirements authors its own baseline without `extends_ref`.

Standard-library baselines may include only `origin: standard` controls and may not set `extends_ref`. Organization baselines may mix standard and custom controls and use UUID or domain-prefixed IDs.

### 7.6 `test`

A `test` defines how a control is verified over time. While a `control` describes the security practice, the `test` objects referencing it describe the recurring checks that prove the practice is operating. A single control may have multiple tests; executing a test yields a `result`, and any artifacts declared by the run become `evidence`.

Standard-library tests describe *what* must be checked in `description`, stopping short of executable scripts because actual commands depend on each organization's identity provider, cloud environment, and tooling. Organizations implement those checks by authoring their own `test` objects with an executable `run` block and linking them back to the standard check via `fulfills_ref`.

**Key fields:**

- `required`: When `true` (default `false`), the test gates whether its control is `met` in [Section 8](#8-computed-status). Non-required tests remain visible for monitoring without blocking compliance. When an organization test sets `fulfills_ref`, it inherits the gating role of the test it fulfills and its own `required` flag is ignored.
- `interval`: Governs how fresh a passing result must be. `continuous` and `daily` share the same 1-day freshness window in [Section 8](#8-computed-status), with `continuous` signaling the harness to run as frequently as practical.
- `method`: Either `automated` or `manual`. Manual tests never carry a `run` block and may reference an operator runbook via `procedure_ref` (library tests never reference organization procedures). Automated tests may omit `run` when acting as an abstract library specification; a harness executes a test only when `run` is present.
- `fulfills_ref`: Points to a `test` on the same `control_ref` that does not itself set `fulfills_ref` (one level deep). Once one or more non-revoked organization tests fulfill a library test, those fulfilling tests become the active methodology and results against the original library test no longer count toward status.
- `system_refs`: Optional on organization tests to scope a check to specific systems (omitted means the test applies to every system). This allows an organization to fulfill one library test differently for two environments with different identity providers; only tests applicable to a program's system replace the library test for that program. Library and provider tests never set `system_refs`.
- `objective_refs`: Optional list of requirement `#obj.` fragments that the test helps verify. The harness copies this list onto emitted results (a partial run may carry a subset). It is informational for assessment traceability and does not alter pass/fail status.

Library test example:

```yaml
type: test
id: test--ogrl-ac-01-unique-idp-users
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
name: Active IdP users are unique
control_ref: control--ogrl-ac-01
objective_refs:
  - requirement--nist-sp-800-53-r5-ac-2#obj.a
method: automated                  # automated | manual
interval: monthly
required: true
description: >
  Fail if two active users share an employee identifier, or if an
  active user has no identifier.
```

Organization test fulfilling the library check:

```yaml
type: test
id: test--9f1c2d3e-4a5b-4c6d-8e7f-001122334455
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
name: Active IdP users are unique
control_ref: control--ogrl-ac-01
fulfills_ref: test--ogrl-ac-01-unique-idp-users
method: automated
interval: monthly
description: >
  Export workforce users from the IdP and fail when two active
  users share an employee identifier.
run:
  runner: shell
  timeout: 5m
  env:
    - IDP_TENANT
  command: |
    set -eu
    ./checks/unique-idp-users.sh
  evidence:
    - path: idp-users.json
      name: IdP user export
      media_type: application/json
```

**Runners.** Version `0.1.0` specifies three runners. `shell` executes an organization-authored script. `rule` and `integration` evaluate vendor state collected by an integration (see [Snapshots](#snapshots) below). The `runner` field is an open token so future revisions can introduce additional runners without changing the envelope. If a harness encounters an unrecognized `runner`, it must preserve the object, skip execution, and record a `result` with `outcome: error`.

**The `run` block (`runner: shell`).**

| Field | Required | Meaning |
|---|---|---|
| `runner` | Yes | `shell` in `0.1.0`. |
| `command` | Yes | Shell script body written to a file and executed via `sh`. |
| `timeout` | No | Positive integer followed by `s` or `m`. Defaults to `5m`; maximum `60m`. |
| `env` | No | List of environment variable *names* required by the script. Values are never stored in the object. |
| `evidence` | No | Output files the script produces for collection as `evidence` objects. |
| `evidence[].path` | Yes (per entry) | Path relative to the scratch directory; must not be absolute or contain `..`. |
| `evidence[].name` | Yes (per entry) | Human-readable title copied onto the created `evidence` object. |
| `evidence[].media_type` | Yes (per entry) | MIME media type copied onto `evidence.resource.media_type`. |

Commands are trusted by the organization that authors them and execute with credentials held in the harness's secret store. Declaring `IDP_TENANT` under `env` documents the contract without exposing values; hardcoding credentials or tenant tokens inside `command` is an authoring defect that reviewers should reject.

**Harness execution contract.** Given a test with `run.runner: shell`, a target `implementation` of the test's control, and an evaluation date, a conforming harness must:

1. Create an isolated scratch directory for the run and remove it afterward.
2. Export every variable listed in `run.env` from the configured secret store (if any required variable is missing, abort with `outcome: error`). Also export each resolved control parameter as `OGRL_PARAM_<NAME>` (uppercased), along with `OGRL_CONTROL_ID`, `OGRL_TEST_ID`, `OGRL_IMPLEMENTATION_ID`, and—when the implementation sets `system_ref`—`OGRL_SYSTEM_ID`. (Runs against a component-level implementation have no `OGRL_SYSTEM_ID`, and their results apply across every system that inherits that component.)
3. Write `command` into the scratch directory and execute it with `sh`, using the scratch directory as the working directory.
4. Terminate the process if it exceeds `timeout`, recording `outcome: error`.
5. Map process exit codes to outcomes: `0` → `pass`, `1` → `fail`, any other exit code → `error`.
6. Populate `result.summary` from the last non-empty line of stdout, truncated to 2 KB. Stdout is never treated as evidence; scripts that wish to preserve logs as evidence must write them to a file declared under `run.evidence`.
7. Verify declared evidence files: for a `pass`, every declared path must exist (a missing file downgrades the outcome to `error`). For a `fail` or `error`, collect whichever declared files exist.
8. Emit one `evidence` object per collected file with `method: automated`, its SHA-256 digest, `valid_from` set to the evaluation date, `valid_until` set to the evaluation date plus the test's freshness window ([Section 8](#8-computed-status)), and `resource.uri` pointing to wherever the harness persisted the bytes.
9. Emit one `result` object referencing the test and implementation, with `observed` set to the run timestamp, the computed `outcome` and `summary`, `evidence_refs` for collected files, and `objective_refs` copied from the test.

Each run produces a new `result` object without mutating the `test` or overwriting prior results.

#### Snapshots

The `rule` and `integration` runners never contact a vendor. They evaluate **snapshots**: JSON documents an integration collected earlier from a vendor system, such as every user in an identity provider or every repository in a source host. Collecting snapshots, holding vendor credentials, and binding a vendor account to a `component` or `system` are application concerns (the OGRL application specifies them in its RFC 0005). The language fixes only what a check reads, so the same rule gives the same answer on any conforming harness.

A **source** names one kind of snapshot:

```text
<integration>/<resource>@<major>
dev.adversity.okta/users@1
```

`<integration>` is a reverse domain name controlled by the integration's publisher, as for [extensions](#719-extensions). `<resource>` matches `[a-z0-9-]+`. `<major>` is a positive integer that the publisher increments whenever a change to the item shape could alter the outcome of an existing rule.

A snapshot document is a JSON object with at least these members (media type `application/vnd.ogrl.snapshot+json`):

```json
{
  "source": "dev.adversity.okta/users@1",
  "collected": "2026-11-08T17:04:00Z",
  "complete": true,
  "items": [
    { "id": "00u1a2b3", "name": "alice@company.com", "status": "ACTIVE", "mfa_enrolled": true }
  ]
}
```

`collected` is when the collection finished. `complete` is `false` when the collection stopped early, for example on a rate limit or a missing permission. `items` holds one JSON object per vendor record. A harness never evaluates an incomplete snapshot, because a partial user list can hide exactly the account a rule exists to catch.

**Snapshot selection.** Given a test, a target `implementation`, and an evaluation instant, the harness proceeds for each source the test reads:

1. Find every vendor account the application binds to the implementation's scope for that source's integration.
2. From each binding, take the latest complete snapshot of the source whose `collected` falls inside the test's freshness window ([Section 8](#8-computed-status)) before the evaluation instant. The harness may collect a fresh snapshot first. If any binding has no qualifying snapshot, or there are no bindings, the run ends with `outcome: error`.
3. Concatenate the items from all bindings, ordered by binding identifier and then by position within each snapshot.

**Results and evidence for snapshot runners.** Both runners record:

- One `result` whose `observed` is the earliest `collected` among the evaluated snapshots, since the run cannot describe vendor state more recent than its oldest input.
- One `evidence` object per evaluated snapshot, with `method: automated`, `collected` copied from the snapshot, the SHA-256 digest of the snapshot bytes, `resource.media_type: application/vnd.ogrl.snapshot+json`, `valid_from` set to the UTC date of `collected`, and `valid_until` set to that date plus the test's freshness window. Several results may reference evidence that points at the same snapshot bytes.
- `subjects` on the result for each failing item, so reviewers see which accounts or resources failed without opening the snapshot.

#### The rule runner

A `rule` run evaluates [Common Expression Language](https://github.com/google/cel-spec) (CEL) expressions over a snapshot. CEL is side-effect free, cannot loop without bound, and has independent implementations, so an organization can author a check without shipping code and every harness reaches the same outcome.

```yaml
type: test
id: test--5b8e1f0a-2c3d-4e5f-8a9b-0c1d2e3f4a5b
spec_version: 0.1.0
created: 2026-11-21T00:00:00Z
modified: 2026-11-21T00:00:00Z
name: Every active Okta user is enrolled in MFA
control_ref: control--ogrl-ia-01
fulfills_ref: test--ogrl-ia-01-mfa-enforcement
method: automated
interval: daily
run:
  runner: rule
  source: dev.adversity.okta/users@1
  select: item.status == "ACTIVE" && item.type == "human"
  assert: item.mfa_enrolled
```

| Field | Required | Meaning |
|---|---|---|
| `runner` | Yes | `rule`. |
| `source` | Yes | The one source the rule reads. |
| `select` | No | Boolean expression over `item`. Items for which it is `false` are out of scope. Defaults to `true`. |
| `assert` | One of `assert`, `aggregate` | Boolean expression over `item`. Every selected item must satisfy it. |
| `aggregate` | One of `assert`, `aggregate` | Boolean expression over `items`, the list of selected items. Use it for conditions about the set, such as uniqueness or a minimum count. |
| `subject` | No | Expression over `item` producing a map with `kind`, `name`, and `external_id` strings, used for failing items. Defaults to `kind` set to the source's `<resource>`, `external_id` set to `string(item.id)`, and `name` set to `string(item.name)` (each omitted when the field is absent). |
| `allow_empty` | No | When `false` (the default), a run that selects no items ends with `outcome: error`. An empty selection usually means a permission is missing, not that the control passed. |

Expressions see these variables: `item` (one item, in `select`, `assert`, and `subject`), `items` (selected items, in `aggregate`), `snapshot` (an object whose `items` member holds every concatenated item, before `select`), `params` (resolved control parameters as a map of strings), and `observed` (the result's `observed`, as a CEL `timestamp`). No expression can read the clock. A rule about age, such as keys older than 90 days, compares against `observed`:

```yaml
assert: observed - timestamp(item.created) <= duration(params.max_key_age_hours + "h")
```

A conforming harness provides the CEL standard definitions and macros (`has`, `all`, `exists`, `exists_one`, `map`, `filter`), RE2 `matches`, and these OGRL functions:

| Function | Meaning |
|---|---|
| `list.distinct()` | The list without repeated elements, keeping first occurrences. |
| `list.duplicates()` | Elements that occur more than once, each listed once, in order of first repetition. |
| `string.lowerAscii()` | The string with ASCII letters lowercased. |

The uniqueness check in the library test above becomes:

```yaml
run:
  runner: rule
  source: dev.adversity.okta/users@1
  select: item.status == "ACTIVE"
  assert: has(item.employee_id) && item.employee_id != ""
  aggregate: items.map(u, u.employee_id).duplicates().size() == 0
```

**Rule harness contract.** After selecting snapshots, a conforming harness must:

1. Reject the run with `outcome: error` if any expression fails to compile, if an expression yields a non-boolean where a boolean is required, or if evaluating any item raises an error. The summary names the field and, for item errors, the zero-based item position.
2. Evaluate `select` on each item. If the selection is empty and `allow_empty` is not `true`, record `outcome: error`.
3. Evaluate `assert`, when present, on each selected item, and `aggregate`, when present, once over `items`.
4. Record `outcome: pass` when every assertion holds, and `outcome: fail` otherwise.
5. Set `summary` to `N of M selected items pass`, appending `; aggregate failed` when `aggregate` is `false`. Record one `subjects` entry per item that failed `assert`, in item order.

A harness may stop an expression that exceeds an evaluation cost limit and record `outcome: error`. The limit is set by the application.

#### The integration runner

An `integration` run hands snapshots to a check written in code and shipped by an installed integration. Use it when the logic is too involved for a rule, such as comparing branch rules against repository settings across two sources.

```yaml
type: test
id: test--8c2d4e6f-1a3b-4c5d-9e7f-a0b1c2d3e4f5
spec_version: 0.1.0
created: 2026-11-21T00:00:00Z
modified: 2026-11-21T00:00:00Z
name: Production branches require review and passing checks
control_ref: control--ogrl-cm-01
fulfills_ref: test--ogrl-cm-01-change-control
method: automated
interval: daily
run:
  runner: integration
  check: dev.adversity.github/branch-protection@1
  sources:
    - dev.adversity.github/repositories@1
    - dev.adversity.github/rulesets@1
  with:
    min_approvals: "1"
    branch_pattern: main
```

| Field | Required | Meaning |
|---|---|---|
| `runner` | Yes | `integration`. |
| `check` | Yes | `<integration>/<check>@<major>`, using the same grammar as a source. |
| `sources` | Yes | Every source the check reads. Each must belong to the same integration as the check. |
| `with` | No | Arguments to the check, as a map of strings. |
| `timeout` | No | As for `shell`. Defaults to `5m`; maximum `60m`. |

**Integration harness contract.** After selecting snapshots for every listed source, a conforming harness must:

1. Record `outcome: error` if no installed version of the integration provides the check at the requested major version.
2. Invoke the check with the snapshots, `with`, and resolved control parameters. The check receives no vendor credentials and no secrets. Every vendor call happened during collection.
3. Enforce `timeout` as for `shell`, recording `outcome: error` on expiry.
4. Accept from the check an outcome of `pass`, `fail`, or `error`, a summary (truncated to 2 KB), and optional `subjects`. Anything else, or a crash, ends the run with `outcome: error`.

Integrations ship checks inside the integration rather than as objects in a bundle, so a check's behavior is pinned by the installed integration version, not by the test. Two harnesses running the same test against the same snapshots must use the same integration version to promise the same outcome. Rule-based tests carry their whole logic in the object and need no such pin.

### 7.7 `party`

A `party` represents any person, team, role, or external organization that owns, operates, approves, or supplies part of a security program.

```yaml
type: party
id: party--0d4e1c2b-3a49-4e6d-8c8b-9a0f1e2d3c4b
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
name: Security lead
kind: role                         # person | team | role | organization
```

The standard library never ships `party` objects—organizational ownership belongs entirely to the adopting organization.

### 7.8 `component`

A `component` represents a reusable architectural building block within a system boundary, such as an identity provider, cloud partition, shared dataset, or operational service. Systems compose components via `component_refs`, and any control implementation attached to a component is automatically inherited by every system that includes it unless that system defines an override.

Cloud and software providers can publish a provider bundle containing their `party`, their `component`, and one `implementation` per control they inherit, share, or leave to customers (see [RFC 0002 section 7](0002-tooling.md#7-provider-bundles)). These same objects render cleanly to an OSCAL component definition (comparable to the [CivicActions Django component definition](https://github.com/CivicActions/oscal-component-definitions/tree/main/django)).

A component is an architectural unit, not a CMDB asset—it carries no serial numbers, host inventories, or instance counts.

```yaml
type: component
id: component--a1b2c3d4-e5f6-4781-92a3-b4c5d6e7f809
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
name: Corporate IdP
kind: software                     # infrastructure | software | people | data | procedure | service
description: >
  Workforce identity provider. Employees and their groups live here.
party_ref: party--a3bb189e-8bf9-4388-9912-ace4e6543002
```

`party_ref` is optional and identifies the operating organization when the component is run by an external provider rather than the system owner.

### 7.9 `system`

A `system` captures the structural description of an in-scope environment—equivalent to the front matter of an SSP: its purpose, authorization boundary, constituent components, data categorizations, and external parties.

```yaml
type: system
id: system--3fa85f64-5717-4562-b3fc-2c963f66afa6
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
name: Customer production environment
function: >
  Multi-tenant application customers use to manage their work.
boundary: >
  Production AWS organization, the GitHub organization,
  and the corporate IdP.
component_refs:
  - component--a1b2c3d4-e5f6-4781-92a3-b4c5d6e7f809
information_types:
  - name: Customer content
    description: Documents and messages customers store in the product.
    confidentiality: moderate      # low | moderate | high
    integrity: moderate
    availability: low
    component_refs:
      - component--a1b2c3d4-e5f6-4781-92a3-b4c5d6e7f809
parties:
  - party_ref: party--a3bb189e-8bf9-4388-9912-ace4e6543002
    role: subservice               # subservice | customer | operator
    function: Cloud infrastructure
    authorization:
      identifier: FedRAMP-Moderate-123456
      authorized: 2024-06-01
      expires: 2027-06-01
```

`information_types` provides the FIPS 199 / federal SSP categorization for data handled by the system, pairing confidentiality, integrity, and availability impact levels (`low`, `moderate`, or `high`) with the subset of `system.component_refs` that store or process that data.

The optional `authorization` block is permitted only on entries in `parties` with `role: subservice` and records a leveraged authorization (such as a FedRAMP package ID plus its `authorized` and `expires` calendar dates). `identifier` is the external authorization identifier, not an OGRL object ID.

### 7.10 `program`

A `program` binds a single `system` to a single `baseline`, allowing one system to pursue multiple compliance baselines concurrently or across audit cycles.

```yaml
type: program
id: program--7c9e6679-7425-40de-944b-e07fc1f90ae7
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
name: 2026 SOC 2
system_ref: system--3fa85f64-5717-4562-b3fc-2c963f66afa6
baseline_ref: baseline--soc2-s-a-c-pi
```

### 7.11 `implementation`

An `implementation` describes how a specific system or component satisfies a control—conceptually a single cell of a control matrix or SSP. Because there is no monolithic SSP object, renderers assemble SSPs by walking the system, program, components, and their implementations. Updating an implementation's status or narrative writes a new revision with an advanced `modified` timestamp on the same ID.

**Scope (`system_ref` and `component_ref`).** Every implementation must set `system_ref`, `component_ref`, or both:

| Fields set | Scope |
|---|---|
| `system_ref` only | System-wide implementation statement for this control. |
| `component_ref` only | Component-level implementation inherited by every system that includes the component. |
| Both `system_ref` and `component_ref` | System-specific override for that component, replacing the inherited component row for this system only. |

```yaml
type: implementation
id: implementation--2f1e0c3a-7b4d-4e5f-9a6b-1c2d3e4f5a6b
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
system_ref: system--3fa85f64-5717-4562-b3fc-2c963f66afa6
control_ref: control--ogrl-ac-01
status: implemented
# planned | implemented | partial | not-applicable | exception
responsibility: provider            # provider | customer | shared | subservice
parameter_values:
  shared_account_review: quarterly
requirement_parameter_values:
  requirement--nist-sp-800-53-r5-ac-2:
    ac_02_odp_10: monthly
owner_ref: party--0d4e1c2b-3a49-4e6d-8c8b-9a0f1e2d3c4b
narrative: >
  Every employee has one IdP account. Service accounts are created
  in AWS IAM and owned by the platform team. Shared accounts are
  listed in the security register and reviewed quarterly.
```

**Responsibility and origin.** `responsibility` is always written from the perspective of the object's author, identified by `origin` (`organization` by default, or `provider` for rows imported from a vendor's provider bundle):

| `responsibility` | On an organization row (`origin: organization`) | On a provider row (`origin: provider`) |
|---|---|---|
| `provider` | The organization implements the control as the provider of its system. | The publishing provider implements the control on the customer's behalf. |
| `shared` | The organization implements its share and explains the remaining division in `narrative`. | The provider implements its share (`narrative`); the importing organization must implement `customer_responsibility`. |
| `customer` | The organization's downstream customers are responsible for the control. | The importing organization is solely responsible for implementing the control. |
| `subservice` | An upstream subservice party (`subservice_ref`) implements the control. | A subservice party relied on by the provider implements the control. |

`customer` and `subservice` express SOC 2 complementary user-entity / subservice controls and CMMC shared-responsibility matrices. Whenever `responsibility` is `subservice`, `subservice_ref` must identify that party.

An organization never edits an imported `origin: provider` row directly; to fulfill its half of a shared control or override an inherited statement, it authors a separate `origin: organization` implementation.

**Additional fields:**

- `control_ref` / `requirement_ref`: Every implementation must specify `control_ref`, `requirement_ref`, or both. Standard OGRL authoring uses `control_ref`; `requirement_ref` alone accommodates imported OSCAL component definitions that speak directly in framework IDs (such as `ac-2`) without referencing OGRL controls (see [Section 8](#8-computed-status) for how these participate in evaluation).
- `customer_responsibility`: Describes the customer's remaining obligation on a provider-authored `shared` or `customer` row, keeping it distinct from the provider's own `narrative`.
- `requirement_parameter_values`: Overrides specific target-framework parameters (keyed by requirement ID, then parameter key) without altering `parameter_values` on the OGRL control (precedence in [Section 7.4](#74-mapping)).
- `status`: When `not-applicable`, `narrative` explains why; when `exception`, an active `exception` object must reference this implementation ([Section 7.20](#720-graph-constraints)).

### 7.12 `result`

A `result` records the outcome of a single execution of a `test` against an `implementation`. Keeping `result` distinct from `evidence` reflects audit reality: a failed or errored check is still an important operational record even when it produces no auditable artifact.

```yaml
type: result
id: result--6ba7b810-9dad-11d1-80b4-00c04fd430c8
spec_version: 0.1.0
created: 2026-11-08T17:00:00Z
modified: 2026-11-08T17:00:00Z
test_ref: test--ogrl-ac-01-unique-idp-users
implementation_ref: implementation--2f1e0c3a-7b4d-4e5f-9a6b-1c2d3e4f5a6b
observed: 2026-11-08T17:00:00Z
outcome: pass                      # pass | fail | error | skip
summary: 418 active users, each with a distinct employee id.
subjects:
  - kind: account
    name: alice@company.com
    external_id: "100231"
objective_refs:
  - requirement--nist-sp-800-53-r5-ac-2#obj.a
evidence_refs:
  - evidence--6ba7b811-9dad-11d1-80b4-00c04fd430c8
```

`subjects` captures lightweight inline identifiers (accounts, hosts, ARNs) so future asset inventories can correlate them by `external_id`. Results for `interval: event-driven` tests must set a `valid_until` timestamp.

Results are immutable once recorded: if a result was logged in error, revoke it and record a new one. Note also that a passing `result` represents a check outcome, not an assessor's formal determination—that belongs in a `finding`.

### 7.13 `finding`

A `finding` records a human assessor's formal determination against a single requirement assessment objective. Assessors may cite test results and evidence while still reaching an independent conclusion.

```yaml
type: finding
id: finding--c0ffee00-9dad-11d1-80b4-00c04fd430c8
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
name: Account types are defined
system_ref: system--3fa85f64-5717-4562-b3fc-2c963f66afa6
objective_ref: requirement--nist-sp-800-53-r5-ac-2#obj.a
determination: satisfied           # satisfied | not-satisfied
observed: 2026-11-08
narrative: >
  The account inventory lists individual, service, and shared
  accounts, and it names the prohibited types.
implementation_ref: implementation--2f1e0c3a-7b4d-4e5f-9a6b-1c2d3e4f5a6b
evidence_refs:
  - evidence--6ba7b811-9dad-11d1-80b4-00c04fd430c8
risk_ref: risk--b7e23ec2-8b7b-4c3a-9f4e-1d5a6c7e8f90
```

Each finding targets exactly one `objective_ref` (multiple objectives produce multiple findings), with `observed` recorded as a calendar date. `implementation_ref`, `evidence_refs`, and `risk_ref` are optional; linking `risk_ref` directly into the organization's risk register avoids duplicating risks for assessors.

For any `(system, objective)` pair, the **finding in force** is the non-revoked finding with the latest `observed` date. Earlier findings remain as assessment history: closing a `not-satisfied` finding means recording a subsequent `satisfied` finding rather than mutating the original record. Reports—including POA&Ms—operate on findings in force.

Findings are reported alongside computed control status ([Section 8](#8-computed-status)) and do not override `met`, `waived`, `out-of-scope`, or `gap`.

### 7.14 `evidence`

An `evidence` object references a supporting artifact by URI and cryptographic hash, bounded by a validity window. Raw artifact bytes are never embedded inside the OGRL object itself; `resource.uri` may be either an absolute URI or a path relative to the bundle root.

```yaml
type: evidence
id: evidence--6ba7b811-9dad-11d1-80b4-00c04fd430c8
spec_version: 0.1.0
created: 2026-11-08T17:05:00Z
modified: 2026-11-08T17:05:00Z
name: IdP user export, 2026-11-08
collected: 2026-11-08T17:04:00Z
valid_from: 2026-11-08
valid_until: 2026-12-08
method: automated                  # automated | upload | attestation | link
implementation_ref: implementation--2f1e0c3a-7b4d-4e5f-9a6b-1c2d3e4f5a6b
result_ref: result--6ba7b810-9dad-11d1-80b4-00c04fd430c8
resource:
  uri: evidence/2026-11-08-idp-users.csv
  media_type: text/csv
  digest:
    algorithm: sha-256
    value: 0000000000000000000000000000000000000000000000000000000000000000
```

`result_ref` is optional so evidence can be attached directly to an implementation without a test run; when both are present, the referenced `result.evidence_refs` must include this evidence ID.

Digest requirements depend on `method`:

| `method` | `resource.uri` | `resource.digest` |
|---|---|---|
| `automated`, `upload` | Storage location of the artifact bytes. | Required (SHA-256 of the bytes). |
| `attestation` | Storage location of the signed attestation document. | Required (SHA-256 of the document). |
| `link` | External page or record referenced by the author. | Optional; when supplied, SHA-256 of the snapshot retrieved at `collected`. |

An evidence record missing the digest required by its `method` is considered **incomplete**. Stores may hold incomplete records to support two-step uploads, but incomplete evidence never counts toward computed status ([Section 8](#8-computed-status)).

Once evidence is complete, `resource`, `method`, `collected`, `valid_from`, `valid_until`, `implementation_ref`, and `result_ref` are immutable. Correcting a mistake requires revoking the record and creating a new one, and renewing coverage means collecting fresh evidence rather than extending `valid_until` on an existing artifact.

### 7.15 `policy`

A `policy` pairs an organization's formally adopted governance document (stored externally as Markdown or another document format and pinned by SHA-256 digest) with the controls it governs. OGRL does not decompose policy documents into individual section objects.

```yaml
type: policy
id: policy--1a2b3c4d-5e6f-4781-92a3-b4c5d6e7f809
spec_version: 0.1.0
created: 2026-01-15T00:00:00Z
modified: 2026-01-15T00:00:00Z
name: Access Control Policy
status: adopted                    # draft | adopted | retired
version: "1.4"
adopted: 2026-01-15
review_interval: annual
owner_ref: party--0d4e1c2b-3a49-4e6d-8c8b-9a0f1e2d3c4b
control_refs:
  - control--ogrl-ac-01
resource:
  uri: policy/access-control.md
  media_type: text/markdown
  digest:
    algorithm: sha-256
    value: 0000000000000000000000000000000000000000000000000000000000000000
```

A policy with `status: adopted` must include `resource.digest`, `adopted`, and `owner_ref`. An optional `reviewed` calendar date tracks the most recent review; the next review falls due one `review_interval` after `reviewed` (or after `adopted` if not yet reviewed). Workforce policy acknowledgment is tracked as a `result` against the relevant acknowledgment control, not as a roster embedded on the policy object.

### 7.16 `procedure`

A `procedure` documents the repeatable operational steps people follow to carry out a policy, using the same external hash-addressed document pattern.

```yaml
type: procedure
id: procedure--9c858901-8a57-4791-81fe-4c455b099bc9
spec_version: 0.1.0
created: 2026-01-15T00:00:00Z
modified: 2026-01-15T00:00:00Z
name: Quarterly access review
status: adopted
policy_ref: policy--1a2b3c4d-5e6f-4781-92a3-b4c5d6e7f809
control_refs:
  - control--ogrl-ac-04
interval: quarterly
owner_ref: party--0d4e1c2b-3a49-4e6d-8c8b-9a0f1e2d3c4b
resource:
  uri: procedure/quarterly-access-review.md
  media_type: text/markdown
  digest:
    algorithm: sha-256
    value: 0000000000000000000000000000000000000000000000000000000000000000
```

### 7.17 `risk`

A `risk` captures an identified threat or weakness, its inherent and optional residual scores, its chosen treatment, and its remediation milestones.

Likelihood and impact are integers from `1` to `5`:

| Score | Likelihood | Impact |
|---|---|---|
| `1` | Rare within a year | Negligible; no customer or regulatory effect. |
| `2` | Unlikely | Low; limited internal effect. |
| `3` | Possible | Moderate; noticeable but contained customer effect. |
| `4` | Likely | High; material customer, contractual, or regulatory effect. |
| `5` | Expected more than once a year | Severe; existential or reportable breach-scale impact. |

Objects store only the numeric scores. Tools derive qualitative severity bands consistently from the 5×5 matrix below:

| Likelihood \ Impact | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| **1** | low | low | low | medium | medium |
| **2** | low | low | medium | medium | high |
| **3** | low | medium | medium | high | high |
| **4** | medium | medium | high | high | critical |
| **5** | medium | high | high | critical | critical |

```yaml
type: risk
id: risk--b7e23ec2-8b7b-4c3a-9f4e-1d5a6c7e8f90
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
name: Shared production admin credential
system_ref: system--3fa85f64-5717-4562-b3fc-2c963f66afa6
statement: >
  A shared admin credential would let a departed engineer keep
  production access.
likelihood: 2
impact: 5
residual_likelihood: 1
residual_impact: 5
treatment: mitigate               # mitigate | accept | transfer | avoid
status: treating                  # open | treating | accepted | closed
owner_ref: party--0d4e1c2b-3a49-4e6d-8c8b-9a0f1e2d3c4b
control_refs:
  - control--ogrl-ac-01
review_on: 2027-01-15
milestones:
  - name: Move break-glass to individual vault identities
    due: 2027-02-01
  - name: Remove the shared credential
    due: 2027-03-01
    done: 2027-02-20
```

Setting `status: accepted` requires `treatment: accept`, `approver_ref`, and `review_on`. Optional `residual_likelihood` and `residual_impact` use the same 1–5 scales.

Each entry in `milestones` carries a `name`, a `due` calendar date, and an optional `done` completion date (omitted while open). OGRL defines no separate `poam` type: a Plan of Action and Milestones is rendered directly from open risks with milestones, open exceptions, and `not-satisfied` findings in force.

### 7.18 `exception`

An `exception` represents a time-bounded, formally approved waiver of a control implementation. Exceptions are intentionally separate from risks: a risk can persist even when all controls are operating, whereas an exception explicitly suspends a control requirement until `expires`.

```yaml
type: exception
id: exception--c5d24601-86f7-4e1a-9b2c-3d4e5f607182
spec_version: 0.1.0
created: 2026-11-08T00:00:00Z
modified: 2026-11-08T00:00:00Z
implementation_ref: implementation--2f1e0c3a-7b4d-4e5f-9a6b-1c2d3e4f5a6b
justification: >
  Production admin currently uses a shared break-glass credential
  stored in the vault. Replacement is the SSO cutover.
expires: 2027-03-01
approver_ref: party--0d4e1c2b-3a49-4e6d-8c8b-9a0f1e2d3c4b
risk_ref: risk--b7e23ec2-8b7b-4c3a-9f4e-1d5a6c7e8f90
```

`risk_ref` is optional. `implementation_ref` must point to an organization-authored implementation—an organization cannot attach a waiver directly to an imported provider row. To waive an inherited control, the organization creates its own system implementation with `status: exception` and points the exception at that row.

### 7.19 Extensions

Vendor- or organization-specific metadata lives under the envelope's `extensions` map, keyed by a reverse domain name controlled by the extension author. All conforming tools preserve unrecognized extension keys across round trips.

```yaml
extensions:
  com.example.connector:
    product: google-workspace
    query: users.list
```

### 7.20 Graph constraints

A valid OGRL bundle must satisfy all of the following structural invariants:

**Mappings and combined sets**
- `mapping.target_ref` resolves to a `requirement`, and `mapping.source_ref` resolves to a `control` or `requirement`.
- Within any single publication (the standard library or one organization), at most one non-revoked `mapping` may exist for a given `(source, target, part)` tuple. If both a standard-library mapping and an organization-authored mapping exist for the same tuple, the organization's mapping supersedes the library mapping in [Section 8](#8-computed-status) and the library mapping is shown as replaced.
- In `parameter_map`, keys must name parameters on the target requirement, values must name parameters on the source control, and `source_ref` must be a `control`.
- Every mapping listed in `combined_with_refs` must share the same `target_ref` as the declaring mapping, have a `control` as `source_ref`, and carry `relationship` `subset-of` or `intersects-with`. A mapping may belong to at most one combined set.

**Implementations, systems, and baselines**
- Every `implementation` must set `system_ref`, `component_ref`, or both, and must set `control_ref`, `requirement_ref`, or both.
- `implementation.origin` is `organization` (default) or `provider`.
- Provider bundles authored in OGRL YAML must include `customer_responsibility` whenever `origin: provider` and `responsibility` is `shared` or `customer`. (Imported OSCAL component definitions that do not separate customer sentences may omit it, though the control still does not meet.)
- Uniqueness of active implementations: at most one non-revoked implementation may exist per `(system, control)` with no `component_ref`, per `(component, control)` with no `system_ref`, and per `(system, component, control)`.
- Every `component_ref` inside `system.information_types[].component_refs` must appear in that system's `component_refs`.
- `authorization` is permitted only on a `system.parties[]` entry with `role: subservice`, and requires `identifier`, `authorized`, and `expires`.
- `program` references exactly one `system` and one `baseline`.
- `baseline.extends_ref` must reference a baseline that does not itself set `extends_ref`.
- Every entry in `baseline.requirement_refs` must be a bare requirement ID (no fragment), must not be `withdrawn`, and its `framework_ref` must appear in that baseline's `framework_refs`.
- Standard-library baselines may include only `origin: standard` controls and may not set `extends_ref`.

**Tests, results, evidence, and findings**
- `method: manual` tests must not carry a `run` block; `run.runner: shell` requires `command`.
- `run.env` lists variable names only—never secret values.
- `run.evidence[].path` must be relative to the scratch directory, non-absolute, and free of `..` segments.
- `fulfills_ref` must reference a test on the same `control_ref` whose own `fulfills_ref` is unset.
- `test.system_refs` must resolve to `system` objects; library tests must not set `system_refs`.
- `result.test_ref` and `result.implementation_ref` are required, and both must refer to the same control.
- `objective_refs` and `finding.objective_ref` must use `#obj.` fragments matching an `objectives[].id` defined on the target requirement.
- `finding` requires `system_ref`, `objective_ref`, `determination`, `observed`, and `narrative`.
- `evidence` requires `implementation_ref`, `result_ref`, or both. Any present digest must use `sha-256`, subject to the per-method requirements in [Section 7.14](#714-evidence).

**Policies, procedures, risks, and exceptions**
- `policy.status: adopted` and `procedure.status: adopted` require `resource.digest` and `owner_ref`; adopted policies also require `adopted`.
- `risk.status: accepted` requires `treatment: accept`, `approver_ref`, and `review_on`.
- Each risk milestone requires `name` and `due`; when `done` is set, it must fall on or after the risk's `created` date.
- `exception` requires `justification`, `expires`, `approver_ref`, and `implementation_ref`, and `implementation_ref` must target an organization-authored implementation.
- `implementation.status: exception` requires at least one referencing `exception` whose `expires` date is on or after the evaluation date.

## 8. Computed status

Status is always evaluated for a single `program` at a specific RFC 3339 instant. Throughout this section:

- The **evaluation date** is the UTC calendar date of that instant. Calendar-date bounds (`valid_until`, `expires`) are inclusive of the entire UTC day.
- **Freshness windows** are measured in 24-hour days forward from a result's `observed` timestamp.
- **The baseline** refers to the program's **effective baseline** after resolving `extends_ref` ([Section 7.5](#75-baseline)).

None of the derived labels (`met`, `waived`, `out-of-scope`, `gap`, `unmapped`, `contribution`, `covered`) are persisted in bundle objects; every conforming tool computes them identically from the graph.

<!-- figure: status-flow -->

#### Freshness windows and passing tests

| `test.interval` | Freshness window |
|---|---|
| `continuous` | 1 day |
| `daily` | 1 day |
| `weekly` | 7 days |
| `monthly` | 30 days |
| `quarterly` | 90 days |
| `annual` | 365 days |
| `event-driven` | Through the latest result's `valid_until` (required on the result) |

For a given `(test, implementation)` pair, the **current result** is the non-revoked result with the latest `observed` timestamp. A test is **passing** if and only if its current result has `outcome: pass` and the evaluation instant falls within its freshness window. Once a newer result exists, any earlier pass ceases to count; `fail`, `error`, and `skip` are never passing.

A test **applies** to a program if its `system_refs` is omitted or contains the program's system.

#### Selecting implementations under evaluation

For each control on the baseline, the evaluator determines the active set of implementations for the program's system as follows:

1. **System-level implementation present:** If the system has a non-revoked implementation for the control with no `component_ref`, that row is evaluated and replaces inherited component implementations—with one important exception. If an included component carries an `origin: provider` implementation with `responsibility: shared`, that row remains beside the system implementation as the **provider's half**, because the organization's own statement covers only the customer side of a shared control. (To stop relying on that provider for the control altogether, the organization writes a system-specific override setting both `system_ref` and `component_ref`, which replaces the provider's row for this system.)
2. **No system-level implementation:** The evaluator collects the control's implementations from all components included in `system.component_refs`. Any row setting both `system_ref` (for this system) and `component_ref` replaces the component's generic inherited row for this system.
3. **Requirement-addressed provider rows:** An `origin: provider` row that specifies `requirement_ref` without `control_ref` (for example, from an imported OSCAL component definition) joins the evaluated set for a control only if a reviewed mapping from that control to the referenced requirement (or one of its parts) has relationship `equal-to`, `equivalent-to`, or `subset-of`. Direction is strict: because the provider speaks for the whole requirement, its coverage reaches controls equal to or narrower than that requirement, but does not reach controls that are `superset-of` or merely `intersects-with` it.

Findings never alter control status.

#### Control status

A baseline control is **`met`** if at least one implementation is under evaluation, every primary implementation satisfies all six conditions below, and every accompanying **provider's half** holds:

1. **Implemented:** `implementation.status` is `implemented`.
2. **Eligible responsibility:**
   - On an `origin: organization` row, `provider` and `shared` can satisfy the control; `customer` and `subservice` delegate the work elsewhere and instead yield `out-of-scope` (see below).
   - On an `origin: provider` row, `provider` and `subservice` can satisfy the control; `shared` and `customer` cannot—a `shared` provider row leaves the control in `gap` until the organization authors its own implementation covering `customer_responsibility`.
3. **Parameters resolved:** Every parameter referenced in the control's `statement` resolves to a value for this program.
4. **Required tests satisfied:** Every applicable `required: true` test for the control is satisfied:
   - If one or more non-revoked applicable tests reference it via `fulfills_ref`, those fulfilling tests replace it: every one of them must be passing, and results on the original test are ignored. (Fulfilling tests that do not apply to this program's system are ignored.)
   - Otherwise, the test itself must be passing. A required `method: automated` test with neither a `run` block nor an applicable fulfillment produces a `gap` noting that no methodology is defined; a `method: manual` test requires no `run` block and passes via human-recorded results.
   - *Provider exception:* On an `origin: provider` implementation with `responsibility` `provider` or `subservice`, unexpired evidence attached to the implementation (such as the provider's audit report) satisfies any unfulfilled library test. If the organization has defined a fulfilling test of its own, that test must still pass.
5. **Unexpired evidence:** Every evidence record cited by the passing results (or relied upon under the provider exception) is complete and has `valid_until` on or after the evaluation date.
6. **Evidence floor when untested:** If no applicable `required: true` test exists for the control, at least one complete evidence record with `implementation_ref` pointing to this implementation must have `valid_until` on or after the evaluation date. Marking `status: implemented` without supporting evidence never satisfies a control.

A **provider's half** (a provider-authored `shared` row accompanying a system implementation) holds when its `status` is `implemented` and every evidence record attached to it has `valid_until` on or after the evaluation date. If either the system implementation or a provider's half fails, the control is a `gap` identifying which half failed.

When a control is not `met`, the remaining states are evaluated on the primary implementations (excluding any accompanying provider's half):

- **`waived`:** Every primary implementation has `status: exception` and is referenced by at least one active `exception` whose `expires` date is on or after the evaluation date.
- **`out-of-scope`:** Every primary implementation either has `status: not-applicable` or is an `origin: organization` row with `responsibility` `customer` or `subservice`.
- **`gap`:** Every other case. Gap output must identify the specific condition(s) that failed.

<!-- figure: status-explorer -->

#### Requirement coverage

Requirement coverage is evaluated for every non-revoked, non-withdrawn requirement in the program's effective baseline. If a subsequent library pull marks a previously listed requirement as `withdrawn`, it drops out of coverage computation and is surfaced in the pull report.

**Units.** A requirement's **units** are its leaf parts—the parts whose ID is not a dotted prefix of another part's ID (for example, if `d.1` exists, `d.1` is a unit and `d` is not). A requirement with no `parts` has a single unit. A mapping without a fragment reaches every unit of the requirement; a mapping to `#d` reaches `d` (or every leaf unit nested beneath `d`).

**Counted mappings and paths.** A mapping counts toward coverage if its `source_ref` is a control on the effective baseline, it is not revoked, its `relationship` is not `no-relationship`, and it is reviewed—meaning either `review_status: reviewed` on the mapping itself or a current accepting `mapping_review` ([RFC 0002 section 6](0002-tooling.md#6-mapping-reviews)). A current `mapping_review` with `review_status: rejected` excludes the mapping regardless of the library's own `review_status`.

A **path** to a unit is either:

- A single counted mapping reaching the unit with `equal-to`, `equivalent-to`, or `superset-of`; or
- A combined set ([Section 7.4](#74-mapping)) whose target reaches the unit and in which every member mapping is counted.

A path **holds** when every source control on it is `met` (`waived` and `out-of-scope` controls do not count as `met`, and reports should note why a control is not met). A unit is covered when at least one path to it holds.

Requirement states are assigned on a first-match basis:

| State | Condition |
|---|---|
| **`unmapped`** | No counted mapping reaches any unit of the requirement. |
| **`contribution`** | At least one unit has no path (any counted partial mappings are displayed as contributions). |
| **`gap`** | Every unit has at least one path, but at least one unit has no path that holds (naming the unmet controls). |
| **`covered`** | Every unit has at least one path that holds. |

Any unit lacking a path holds the entire requirement at `contribution`—unmapped parts are never silently skipped. Separating `unmapped` from `gap` keeps authoring gaps (no reviewed crosswalk yet) clearly distinct from operational gaps (crosswalk is complete, but the control is not met).

### 8.1 What an SSP render contains

When rendering a System Security Plan—or the system-description-and-control-matrix package requested by SOC 2 and CMMC auditors—a renderer walks the graph to assemble:

1. The `system`: function, boundary, components, information types, parties, and any leveraged authorizations.
2. The `program` and its effective `baseline`.
3. For each baseline control: the parameter-resolved control statement, active system and component implementations, latest results for each required test, unexpired evidence, and any active exceptions.
4. Findings on the system, presented alongside computed control status.
5. Adopted policies and procedures governing those controls.
6. Open risks linked to those controls, including their remediation milestones.

Every rendered package is disposable; edits always happen on the underlying OGRL objects. [RFC 0002 section 9](0002-tooling.md#9-oscal-export) specifies the OSCAL projection of this render (profile, SSP, mapping collection, component definition, assessment results, and POA&M) for a given system and target NIST framework.

## 9. Authoring layout

Tools storing a graph in Git follow this conventional directory layout (though conforming tools may store objects anywhere so long as IDs and references resolve):

```text
library/
  bundle.yaml
  framework/
  requirement/soc2-tsc-2017/
  requirement/nist-sp-800-53-r5/     # generated from OSCAL
  control/
  mapping/
  baseline/
  test/
org/
  bundle.yaml
  party/
  component/
  system/
  baseline/                          # organization baselines, when tailoring a library baseline
  program/
  implementation/
  policy/
  procedure/
  evidence/                          # metadata objects; blobs live beside them or in object storage
  result/
  finding/
  risk/
  exception/
```

Authors hand-edit `library/control`, `library/mapping`, `library/baseline`, and `library/test`. NIST requirement trees are generated by `ogrl import` and should never be hand-edited. Citation-only indexes (SOC 2 and ISO/IEC 27001) are compact enough to author directly, while HIPAA Security Rule requirements may include verbatim CFR text.

**Validation slice.** The initial reference slice that proves out this RFC is the access-control family (`ac`): roughly eight controls mapped to SP 800-53 (including statement parts), SP 800-171 Rev 2 (`3.1.x` and `3.5.3`), and SOC 2 (`CC6.1`–`CC6.3`), paired with one baseline, one library automated test, one manual test, and a sample `org/` graph (a system, implementations, a fulfilling `shell` test, a result, evidence, a policy, and a risk). The model is considered sound once that bundle is clean to review in Git and a tool can render both control status and a one-page SSP directly from it with no sideband data.

## 10. External catalogs and copyright

| Framework | Ingestion method | Text carried in library |
|---|---|---|
| NIST SP 800-53 Rev 5.2.0 and SP 800-53B (low, moderate, high, privacy) | Compiled from pinned `oscal-content` catalog and profiles | Permitted (public domain). |
| NIST SP 800-171 Rev 3 and SP 800-172 Rev 3 | Compiled from `oscal-content` | Permitted. |
| NIST SP 800-171 Rev 2 | Authored from the NIST publication (`oscal-content` publishes Rev 3, while CMMC Level 2 assesses Rev 2) | Permitted. |
| CMMC Level 1 | 17 practices aligned to FAR 52.204-21 | Permitted as FAR citations. |
| CMMC Level 2 | Baseline selecting the 110 SP 800-171 Rev 2 requirements | Reuses Rev 2 requirement objects. |
| CMMC Level 3 | Future baseline combining Rev 2 with a selected SP 800-172 subset | Deferred past initial slice. |
| SOC 2 Trust Services Criteria (2017) | Hand-authored index: Security (`CC1.1`–`CC9.2`, 33 criteria), Availability (`A1.1`–`A1.3`), Confidentiality (`C1.1`–`C1.2`), Processing Integrity (`PI1.1`–`PI1.5`) | Identifier, OGRL-authored title, and citation only; AICPA text and points of focus stay out. |
| ISO/IEC 27001:2022 | Hand-authored index covering Annex A (93 controls, `A.5`–`A.8`) and clauses `4`–`10` | Identifier and OGRL-authored title only; ISO text stays out. |
| HIPAA Security Rule | 45 CFR 164.308, 164.310, 164.312, 164.314, 164.316 (required and addressable specifications) | Permitted (CFR is public domain). |
| NIST CSF 2.0 | Planned (already published as OSCAL) | Permitted when added. |

**Hub catalog vs. working set.** SP 800-53 serves as the reference hub—the superset catalog other NIST publications map back to—while the OGRL standard control library stays a compact, operational set of practices. Companies implement OGRL controls rather than checking off raw SP 800-53 statements.

**SP 800-171 revisions.** CMMC Level 2 and DFARS 252.204-7012 currently assess SP 800-171 Rev 2 (110 requirements `3.1.1`–`3.14.7`, 320 objectives in 800-171A), whereas Rev 3 renumbers requirements (`03.01.01`) as a separate catalog; DoD rulemaking RIN 0790-AM01 for the Rev 3 transition is not yet the active assessment baseline. Keeping both catalogs in the model allows future baselines to migrate without rewriting controls.

NIST SP 800-66 Rev 2's crosswalk from the HIPAA Security Rule to SP 800-53 Rev 5 is imported as author-facing requirement-to-requirement mappings; customer-facing HIPAA coverage still relies on directly reviewed mappings from OGRL controls to HIPAA requirements.

### 10.1 OSCAL import

`ogrl import nist` reads a pinned revision of `usnistgov/oscal-content` and compiles SP 800-53 Rev 5.2.0 and SP 800-171 Rev 3 into OGRL files:

- Each catalog produces one `framework` object and one `requirement` per control. Enhancements become standalone requirements with `class: enhancement`.
- Withdrawn controls are emitted with `withdrawn: true` (never `revoked: true`) so their IDs remain resolvable.
- Statements and lettered items are preserved, with nested items using dotted IDs (`a`, `a.1`, `a.1.a`). OSCAL parameter placeholders (`{{ insert: param, ... }}`) are rewritten to `{{ param_key }}` while retaining each parameter's label. Guidance/discussion prose is omitted.
- Assessment objectives map to `objectives` (with local IDs such as `a` or `a.1` addressable via `#obj.`) and assessment methods map to `objectives[].methods` as descriptive prose. *(Note: the current `ogrl import` emits statements, parts, parameters, and draft mappings; adding `objectives` is the next importer pass and will not alter requirement IDs.)*

Cross-requirement links in OSCAL catalogs become draft mappings (`review_status: draft`, `rationale: semantic`, `confidence: low`) and never count as reviewed coverage claims:

| OSCAL link | Imported OGRL relationship |
|---|---|
| SP 800-171 `reference` citing an SP 800-53 control (e.g. `AC-02(03)`) | `intersects-with` |
| `incorporated-into` | `subset-of` |
| `moved-to` | `equivalent-to` |
| `addressed_by` | `intersects-with` |

`related` and `required` links are not converted into mappings. Links targeting a control family or an external standard (SP 800-162, FIPS, CFR) are recorded under `external_references` instead. Because `oscal-content` ships SP 800-171 Rev 3 rather than Rev 2, `ogrl import oscal` accepts any local OSCAL catalog file so Rev 2 can be imported on demand.

## 11. Conformance

OGRL defines two conformance tiers:

- **Library reader:** Loads `framework`, `requirement`, `control`, `mapping`, `baseline`, and `test`; resolves references among them (including `#part` and `#obj.` fragments); and preserves all unrecognized fields and `extensions` across round trips.
- **Application:** Implements everything required of a library reader, loads all operational object types, and computes control status and requirement coverage exactly as specified in [Section 8](#8-computed-status).

Any conforming tool that **writes** OGRL objects must additionally:

- Emit the full common envelope and all required fields for every type it produces.
- Refuse to mint IDs in the reserved standard-library slug namespace.
- Advance `modified` strictly forward on every mutation, and only when acting as the object's producer (save for the projection-revocation exception in [Section 5](#5-principles)).
- Preserve unknown fields and `extensions` without loss.
- Emit canonical JSON accepted by any other `0.1.0` reader (YAML authoring support is optional for pure API servers).

Tools may maintain internal database columns for indexing and querying, but internal fields become part of the OGRL language only when serialized into defined schema fields or under `extensions`.

## 12. Alternatives considered

- **Author directly in OSCAL:** OSCAL's mapping vocabulary and NIST catalog distribution are valuable, which is why OGRL adopts the vocabulary and bridges to OSCAL at the boundaries. Authoring operational programs in large, XML-descended documents, however, hurts Git reviewability and cross-tool sharing.
- **Adopt SP 800-53 IDs as OGRL control IDs:** SP 800-53 is an ideal reference hub, but with enhancements it is an order of magnitude larger than a typical 100-control operational program and is phrased as high-level organizational duties. Reusing `AC-2` for a differently scoped practice would make every mapping ambiguous; `OGRL-AC-01` keeps the two namespaces cleanly separated.
- **Embed framework mappings inside `control` files:** Convenient for a single author, but brittle the moment mappings are revised independently or frameworks release updates. Separate `mapping` objects decouple practice maintenance from crosswalk maintenance.
- **Turn every edge into a relationship object:** STIX's pure edge-object model works well for machine-generated graphs, but for human-authored programs it would turn one policy governing three controls into three extra files to maintain. OGRL keeps intrinsic references inline and elevates only crosswalks and operational lifecycles into standalone objects.
- **Model SSPs, catalogs, and POA&Ms as object types:** First-class document objects inevitably drift from live implementations, risks, and findings. Treating them as rendered views guarantees consistency; `finding` earns its own type because an assessor's determination has an independent lifecycle from an automated test result.
- **Omit combined coverage or make it a separate object type:** Because practice-sized controls are deliberately narrower than regulatory requirements, omitting combined coverage would leave most requirements permanently stuck at `contribution`. Putting `combined_with_refs` directly on a participating `mapping` avoids multiplying files and review lifecycles while keeping each individual mapping's partial relationship intact.
- **Inline evidence bytes or policy text inside YAML:** Embedding binary artifacts or long prose documents destroys Git diffs and bloats every downstream database. Addressing content by URI and SHA-256 digest keeps objects light and verifiable.
- **Attach shell commands directly to `control`:** Controls are shared practices, whereas executable checks are specific to one organization's infrastructure and credentials, and a single control often needs multiple checks. Keeping `run` on `test`—linked via `fulfills_ref`—preserves clean separation.
- **Let checks call vendor APIs directly:** A check that fetches its own data needs credentials, and each check would repeat the same calls against vendor rate limits. Separating collection from evaluation keeps credentials in one place, lets many checks share one snapshot, and makes the snapshot itself the evidence an auditor can inspect.
- **Rego or JSONPath instead of CEL:** Rego is more expressive but needs a separate engine and is easy to write unbounded queries in. JSONPath selects data but cannot express conditions. CEL is small, bounded, has implementations in Go, Rust, Java, and Python, and is already used for policy in Kubernetes and Google Cloud IAM.
- **Capture stdout as evidence:** Scripts routinely intermix debug logs with real outputs. Requiring explicit `run.evidence` paths ensures only intended artifacts are hashed and preserved, while truncating stdout into `result.summary` still surfaces failure diagnostics.

## 13. Open questions

The body of this RFC fixes a concrete default for each item below so the model is implementable today, but these design points warrant close scrutiny during review:

1. **Derived mapping IDs:** Standard-library mappings currently use readable derived IDs (`mapping--ogrl-ac-01_to_soc2-tsc-2017-cc6.1`), which make filenames predictable and duplicates immediately obvious, at the cost of long IDs and a breaking migration if the naming scheme ever changes. The alternative is opaque UUIDs relying solely on `source_ref` and `target_ref`.
2. **Risk matrix calibration:** The 5×5 scoring anchors and severity bands (`low` through `critical`) in [Section 7.17](#717-risk) provide cross-register consistency, but should be validated with practitioners who run enterprise risk committees.
3. **In-scope responsibilities:** Organization-authored `customer` and `subservice` implementations currently resolve to `out-of-scope` because the work is not the organization's to test. Alternatives include introducing a fifth carved-out state distinct from `not-applicable`, or letting a program specify `in_scope_responsibilities` if it wants organization-authored `shared` controls to remain unmet until both halves pass tests.
4. **Fragment syntax for requirement parts:** URI fragments (`requirement--…-ac-2#a`) keep part identifiers concise and local, at the trade-off that references are not always bare object IDs. Promoting every part to a top-level ID would normalize reference syntax while multiplying object counts.
5. **Storage of generated NIST YAML:** Committing thousands of generated NIST requirement files directly into the OGRL repository keeps the library completely self-contained, whereas generating them on demand from a pinned `oscal-content` submodule or tarball keeps Git history leaner. The object schema is identical either way.
6. **`program` as a standalone type:** Separating `program` from `system` allows a single system to pursue multiple concurrent or historical baselines cleanly. Folding `baseline_ref` onto `system` would shrink the schema by one type at the cost of awkward multi-framework modeling.
7. **Untested controls:** When a control has no required test, the current rule still demands at least one unexpired evidence record so `status: implemented` alone cannot mark a control `met`. The alternative is allowing `status: implemented` to suffice while flagging the control as untested in reports.
8. **Evidence on the provider's half:** A provider-authored `shared` row accompanying a system implementation currently holds on `status: implemented` and valid attached evidence (if any), allowing provider rows with no attached evidence—such as imported OSCAL component definitions—to hold on status alone rather than forcing every imported component into `gap`.
9. **Normalized sources:** Every source today belongs to one integration, so an MFA rule written for Okta does not run against Entra ID. A shared set of normalized sources (such as `dev.ogrl.identity/users@1`) that several integrations emit would let the standard library ship executable `rule` tests, at the cost of OGRL governing those item shapes.

## 14. What this RFC does not freeze

Several adjacent areas are intentionally left open for future specifications: asset and host inventories, vendor management beyond `party.kind: organization`, physical locations, ticketing, workforce training records, and audit-engagement workflows (including assessment schedules/plans). How an application installs integrations, stores vendor credentials, collects snapshots, and binds vendor accounts to components is outside the language; RFC 0001 fixes only the source grammar, the snapshot document, and the `rule` and `integration` runners. Further runners will be specified as harnesses implement them. Additional frameworks such as NIST CSF 2.0, CMMC Level 3, and SOC 2 Privacy can be added purely as data—new `framework`, `requirement`, and `baseline` objects—without modifying the OGRL type system.
