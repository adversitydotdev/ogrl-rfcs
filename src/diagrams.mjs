export const FIGURES = {
  "id-anatomy": {
    number: "1.1",
    caption: "Anatomy of OGRL object identifiers, derived standard-library mapping IDs, and sub-requirement fragments.",
    html: `<svg viewBox="0 0 820 264" class="rfc-svg" role="img" aria-label="OGRL identifier and fragment anatomy">
  <defs>
    <marker id="dot-m" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5">
      <circle cx="4" cy="4" r="3" fill="var(--fg-faint)"/>
    </marker>
  </defs>

  <!-- Example 1: Requirement + objective fragment -->
  <text x="20" y="24" class="svg-eyebrow">SUB-REQUIREMENT REFERENCE</text>
  <rect x="20" y="36" width="780" height="54" rx="8" class="svg-box-subtle"/>

  <rect x="36" y="47" width="132" height="32" rx="5" class="svg-pill-blue"/>
  <text x="102" y="68" text-anchor="middle" class="svg-mono svg-ink-blue">requirement</text>

  <text x="184" y="68" text-anchor="middle" class="svg-mono svg-muted">--</text>

  <rect x="200" y="47" width="244" height="32" rx="5" class="svg-pill-neutral"/>
  <text x="322" y="68" text-anchor="middle" class="svg-mono">nist-sp-800-53-r5-ac-2</text>

  <rect x="454" y="47" width="84" height="32" rx="5" class="svg-pill-amber"/>
  <text x="496" y="68" text-anchor="middle" class="svg-mono svg-ink-amber">#obj.a</text>

  <text x="560" y="68" class="svg-caption-inline">or <tspan class="svg-mono">#a</tspan> for a statement part</text>

  <!-- Callouts row 1 -->
  <line x1="102" y1="84" x2="102" y2="104" class="svg-guide"/>
  <text x="102" y="118" text-anchor="middle" class="svg-label">object type</text>

  <line x1="322" y1="84" x2="322" y2="104" class="svg-guide"/>
  <text x="322" y="118" text-anchor="middle" class="svg-label">remainder (slug, domain slug, or UUID)</text>

  <line x1="496" y1="84" x2="496" y2="104" class="svg-guide"/>
  <text x="496" y="118" text-anchor="middle" class="svg-label">reference fragment</text>

  <!-- Example 2: Derived library mapping ID -->
  <text x="20" y="156" class="svg-eyebrow">DERIVED STANDARD-LIBRARY MAPPING ID</text>
  <rect x="20" y="168" width="780" height="54" rx="8" class="svg-box-subtle"/>

  <rect x="36" y="179" width="96" height="32" rx="5" class="svg-pill-blue"/>
  <text x="84" y="200" text-anchor="middle" class="svg-mono svg-ink-blue">mapping</text>

  <text x="146" y="200" text-anchor="middle" class="svg-mono svg-muted">--</text>

  <rect x="160" y="179" width="122" height="32" rx="5" class="svg-pill-green"/>
  <text x="221" y="200" text-anchor="middle" class="svg-mono svg-ink-green">ogrl-ac-01</text>

  <rect x="290" y="179" width="52" height="32" rx="5" class="svg-pill-muted"/>
  <text x="316" y="200" text-anchor="middle" class="svg-mono svg-muted">_to_</text>

  <rect x="350" y="179" width="244" height="32" rx="5" class="svg-pill-neutral"/>
  <text x="472" y="200" text-anchor="middle" class="svg-mono">nist-sp-800-53-r5-ac-2</text>

  <rect x="602" y="179" width="76" height="32" rx="5" class="svg-pill-muted"/>
  <text x="640" y="200" text-anchor="middle" class="svg-mono svg-muted">_part_</text>

  <rect x="686" y="179" width="42" height="32" rx="5" class="svg-pill-amber"/>
  <text x="707" y="200" text-anchor="middle" class="svg-mono svg-ink-amber">a</text>

  <!-- Callouts row 2 -->
  <line x1="221" y1="216" x2="221" y2="236" class="svg-guide"/>
  <text x="221" y="250" text-anchor="middle" class="svg-label">source slug</text>

  <line x1="472" y1="216" x2="472" y2="236" class="svg-guide"/>
  <text x="472" y="250" text-anchor="middle" class="svg-label">target requirement slug</text>

  <line x1="707" y1="216" x2="707" y2="236" class="svg-guide"/>
  <text x="707" y="250" text-anchor="middle" class="svg-label">part (dots → hyphens)</text>
</svg>`,
  },

  "object-graph": {
    number: "1.2",
    caption: "The closed OGRL object graph split across library-side standards and organization-side operational records. Arrows indicate <code>_ref</code> / <code>_refs</code> pointers.",
    html: `<svg viewBox="0 0 860 520" class="rfc-svg" role="img" aria-label="OGRL object graph showing library types and organization types">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 1 1.5 L 8.5 5 L 1 8.5 z" fill="var(--fg-faint)"/>
    </marker>
    <marker id="arr-blue" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 1 1.5 L 8.5 5 L 1 8.5 z" fill="var(--contribution)"/>
    </marker>
  </defs>

  <!-- Zone 1: Library Side -->
  <rect x="16" y="16" width="828" height="178" rx="10" class="svg-zone-lib"/>
  <text x="32" y="38" class="svg-eyebrow svg-ink-blue">LIBRARY SIDE  (SHARED STANDARD · READ-ONLY PROJECTION IN ORG DB)</text>

  <!-- Library Nodes -->
  <rect x="36" y="56" width="136" height="46" rx="7" class="svg-node"/>
  <text x="104" y="76" text-anchor="middle" class="svg-node-title">framework</text>
  <text x="104" y="92" text-anchor="middle" class="svg-node-sub">NIST, SOC 2, ISO</text>

  <rect x="228" y="56" width="144" height="46" rx="7" class="svg-node"/>
  <text x="300" y="76" text-anchor="middle" class="svg-node-title">requirement</text>
  <text x="300" y="92" text-anchor="middle" class="svg-node-sub">parts, objectives</text>

  <rect x="434" y="56" width="132" height="46" rx="7" class="svg-node"/>
  <text x="500" y="76" text-anchor="middle" class="svg-node-title">mapping</text>
  <text x="500" y="92" text-anchor="middle" class="svg-node-sub">crosswalk + params</text>

  <rect x="630" y="56" width="188" height="46" rx="7" class="svg-node svg-node-accent"/>
  <text x="724" y="76" text-anchor="middle" class="svg-node-title">control</text>
  <text x="724" y="92" text-anchor="middle" class="svg-node-sub">standard or custom practice</text>

  <rect x="228" y="130" width="212" height="46" rx="7" class="svg-node"/>
  <text x="334" y="150" text-anchor="middle" class="svg-node-title">baseline</text>
  <text x="334" y="166" text-anchor="middle" class="svg-node-sub">frameworks, reqs, controls, params</text>

  <rect x="630" y="130" width="188" height="46" rx="7" class="svg-node"/>
  <text x="724" y="150" text-anchor="middle" class="svg-node-title">test</text>
  <text x="724" y="166" text-anchor="middle" class="svg-node-sub">interval, required, run block</text>

  <!-- Library Edges -->
  <line x1="228" y1="79" x2="174" y2="79" class="svg-edge" marker-end="url(#arr)"/>
  <line x1="434" y1="79" x2="374" y2="79" class="svg-edge" marker-end="url(#arr)"/>
  <line x1="566" y1="79" x2="628" y2="79" class="svg-edge" marker-end="url(#arr)"/>
  <line x1="724" y1="130" x2="724" y2="104" class="svg-edge" marker-end="url(#arr)"/>
  <path d="M 228 153 L 104 153 L 104 104" class="svg-edge" fill="none" marker-end="url(#arr)"/>
  <path d="M 440 153 L 604 153 L 604 92 L 628 92" class="svg-edge" fill="none" marker-end="url(#arr)"/>

  <!-- Zone 2: Organization Side -->
  <rect x="16" y="214" width="828" height="290" rx="10" class="svg-zone-org"/>
  <text x="32" y="236" class="svg-eyebrow">ORGANIZATION SIDE  (LIVE PROGRAM · SYSTEM OF RECORD)</text>

  <!-- Row 1 of Org -->
  <rect x="36" y="254" width="144" height="46" rx="7" class="svg-node"/>
  <text x="108" y="274" text-anchor="middle" class="svg-node-title">program</text>
  <text x="108" y="290" text-anchor="middle" class="svg-node-sub">system × baseline</text>

  <rect x="232" y="254" width="144" height="46" rx="7" class="svg-node"/>
  <text x="304" y="274" text-anchor="middle" class="svg-node-title">system</text>
  <text x="304" y="290" text-anchor="middle" class="svg-node-sub">boundary, info types</text>

  <rect x="428" y="254" width="144" height="46" rx="7" class="svg-node"/>
  <text x="500" y="274" text-anchor="middle" class="svg-node-title">component</text>
  <text x="500" y="290" text-anchor="middle" class="svg-node-sub">IdP, cloud, provider</text>

  <rect x="630" y="254" width="188" height="46" rx="7" class="svg-node svg-node-green"/>
  <text x="724" y="274" text-anchor="middle" class="svg-node-title">implementation</text>
  <text x="724" y="290" text-anchor="middle" class="svg-node-sub">status, responsibility, narrative</text>

  <!-- Row 2 of Org -->
  <rect x="36" y="340" width="144" height="46" rx="7" class="svg-node"/>
  <text x="108" y="360" text-anchor="middle" class="svg-node-title">mapping_review</text>
  <text x="108" y="376" text-anchor="middle" class="svg-node-sub">accept / reject mapping</text>

  <rect x="232" y="340" width="144" height="46" rx="7" class="svg-node"/>
  <text x="304" y="360" text-anchor="middle" class="svg-node-title">finding</text>
  <text x="304" y="376" text-anchor="middle" class="svg-node-sub">assessor determination</text>

  <rect x="428" y="340" width="144" height="46" rx="7" class="svg-node"/>
  <text x="500" y="360" text-anchor="middle" class="svg-node-title">evidence</text>
  <text x="500" y="376" text-anchor="middle" class="svg-node-sub">URI, sha-256, expiry</text>

  <rect x="630" y="340" width="188" height="46" rx="7" class="svg-node"/>
  <text x="724" y="360" text-anchor="middle" class="svg-node-title">result</text>
  <text x="724" y="376" text-anchor="middle" class="svg-node-sub">pass | fail | error | skip</text>

  <!-- Row 3 of Org -->
  <rect x="36" y="428" width="144" height="46" rx="7" class="svg-node"/>
  <text x="108" y="448" text-anchor="middle" class="svg-node-title">party</text>
  <text x="108" y="464" text-anchor="middle" class="svg-node-sub">person, team, org</text>

  <rect x="232" y="428" width="144" height="46" rx="7" class="svg-node"/>
  <text x="304" y="448" text-anchor="middle" class="svg-node-title">policy / procedure</text>
  <text x="304" y="464" text-anchor="middle" class="svg-node-sub">adopted Markdown + hash</text>

  <rect x="428" y="428" width="144" height="46" rx="7" class="svg-node"/>
  <text x="500" y="448" text-anchor="middle" class="svg-node-title">risk</text>
  <text x="500" y="464" text-anchor="middle" class="svg-node-sub">5×5 score + milestones</text>

  <rect x="630" y="428" width="188" height="46" rx="7" class="svg-node svg-node-amber"/>
  <text x="724" y="448" text-anchor="middle" class="svg-node-title">exception</text>
  <text x="724" y="464" text-anchor="middle" class="svg-node-sub">approved waiver + expiry</text>

  <!-- Org & Cross-Zone Edges -->
  <!-- program -> baseline -->
  <path d="M 108 254 L 108 204 L 334 204 L 334 178" class="svg-edge-blue" fill="none" marker-end="url(#arr-blue)"/>
  <!-- program -> system -->
  <line x1="180" y1="277" x2="230" y2="277" class="svg-edge" marker-end="url(#arr)"/>
  <!-- system -> component -->
  <line x1="376" y1="277" x2="426" y2="277" class="svg-edge" marker-end="url(#arr)"/>
  <!-- implementation -> component -->
  <line x1="630" y1="277" x2="574" y2="277" class="svg-edge" marker-end="url(#arr)"/>
  <!-- implementation -> control -->
  <path d="M 800 254 L 800 204 L 832 204 L 832 79 L 820 79" class="svg-edge-blue" fill="none" marker-end="url(#arr-blue)"/>
  <!-- result -> implementation -->
  <line x1="724" y1="340" x2="724" y2="302" class="svg-edge" marker-end="url(#arr)"/>
  <!-- result -> evidence -->
  <line x1="630" y1="363" x2="574" y2="363" class="svg-edge" marker-end="url(#arr)"/>
  <!-- finding -> system -->
  <line x1="304" y1="340" x2="304" y2="302" class="svg-edge" marker-end="url(#arr)"/>
  <!-- finding -> evidence -->
  <line x1="376" y1="363" x2="426" y2="363" class="svg-edge" marker-end="url(#arr)"/>
  <!-- exception -> risk -->
  <line x1="630" y1="451" x2="574" y2="451" class="svg-edge" marker-end="url(#arr)"/>
  <!-- exception -> implementation -->
  <path d="M 818 451 L 832 451 L 832 288 L 820 288" class="svg-edge" fill="none" marker-end="url(#arr)"/>
  <!-- mapping_review -> mapping -->
  <path d="M 36 363 L 24 363 L 24 204 L 500 204 L 500 104" class="svg-edge-blue" fill="none" marker-end="url(#arr-blue)"/>
  <!-- result -> test -->
  <path d="M 780 340 L 780 318 L 604 318 L 604 153 L 628 153" class="svg-edge-blue" fill="none" marker-end="url(#arr-blue)"/>
</svg>`,
  },

  "parameter-precedence": {
    number: "1.4",
    caption: "Highest-to-lowest resolution order for control parameters (left) and target-framework parameters such as NIST ODPs (right).",
    html: `<svg viewBox="0 0 820 286" class="rfc-svg" role="img" aria-label="Parameter resolution precedence ladders">
  <defs>
    <marker id="arr-p" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 1 1.5 L 8.5 5 L 1 8.5 z" fill="var(--fg-faint)"/>
    </marker>
  </defs>

  <!-- Left column: Control Parameters -->
  <text x="24" y="24" class="svg-eyebrow">CONTROL PARAMETER  (E.G. {{ shared_account_review }})</text>

  <rect x="24" y="38" width="368" height="48" rx="7" class="svg-node svg-node-green"/>
  <text x="42" y="58" class="svg-mono svg-ink-green">1. implementation.parameter_values</text>
  <text x="42" y="75" class="svg-node-sub">System- or component-specific answer (highest precedence)</text>

  <line x1="208" y1="86" x2="208" y2="106" class="svg-edge" marker-end="url(#arr-p)"/>

  <rect x="24" y="108" width="368" height="48" rx="7" class="svg-node"/>
  <text x="42" y="128" class="svg-mono">2. baseline.parameter_bindings[control]</text>
  <text x="42" y="145" class="svg-node-sub">Program-level policy value from effective baseline</text>

  <line x1="208" y1="156" x2="208" y2="176" class="svg-edge" marker-end="url(#arr-p)"/>

  <rect x="24" y="178" width="368" height="48" rx="7" class="svg-node"/>
  <text x="42" y="198" class="svg-mono">3. control.parameters[].value</text>
  <text x="42" y="215" class="svg-node-sub">Built-in default published on the control</text>

  <rect x="24" y="242" width="368" height="30" rx="6" class="svg-pill-red"/>
  <text x="208" y="261" text-anchor="middle" class="svg-label svg-ink-red">Still unset → control cannot be met (§8)</text>

  <!-- Right column: Target Requirement Parameters -->
  <text x="428" y="24" class="svg-eyebrow">TARGET REQUIREMENT PARAMETER  (E.G. ac_02_odp_10)</text>

  <rect x="428" y="38" width="368" height="48" rx="7" class="svg-node svg-node-green"/>
  <text x="446" y="58" class="svg-mono svg-ink-green">1. implementation.requirement_parameter_values</text>
  <text x="446" y="75" class="svg-node-sub">Per-requirement override without altering control param</text>

  <line x1="612" y1="86" x2="612" y2="106" class="svg-edge" marker-end="url(#arr-p)"/>

  <rect x="428" y="108" width="368" height="48" rx="7" class="svg-node"/>
  <text x="446" y="128" class="svg-mono">2. baseline.parameter_bindings[requirement]</text>
  <text x="446" y="145" class="svg-node-sub">Explicit literal on the effective baseline</text>

  <line x1="612" y1="156" x2="612" y2="176" class="svg-edge" marker-end="url(#arr-p)"/>

  <rect x="428" y="178" width="368" height="48" rx="7" class="svg-node"/>
  <text x="446" y="198" class="svg-mono">3. mapping.parameter_map → control param</text>
  <text x="446" y="215" class="svg-node-sub">Resolved value from mapped source control (conflict = error)</text>

  <rect x="428" y="242" width="368" height="30" rx="6" class="svg-pill-muted"/>
  <text x="612" y="261" text-anchor="middle" class="svg-label">Still unset → left unset in OSCAL export (never fabricated)</text>
</svg>`,
  },

  "mapping-relationships": {
    number: "1.3",
    caption: "Mapping relationships (source control S relative to target requirement T) and how combined_with_refs unions partial controls into full unit coverage.",
    html: `<svg viewBox="0 0 820 316" class="rfc-svg" role="img" aria-label="OSCAL mapping relationship Venn diagrams and combined coverage">
  <!-- Row 1: 3 Full-Coverage relationships -->
  <text x="20" y="22" class="svg-eyebrow svg-ink-green">FULL COVERAGE OF TARGET UNIT</text>
  <text x="430" y="22" class="svg-eyebrow svg-ink-blue">PARTIAL CONTRIBUTION</text>
  <text x="698" y="22" class="svg-eyebrow">EXCLUDED</text>

  <!-- equal-to -->
  <rect x="20" y="34" width="122" height="122" rx="8" class="svg-node"/>
  <circle cx="81" cy="84" r="24" class="svg-venn-t"/>
  <circle cx="81" cy="84" r="24" class="svg-venn-s-green"/>
  <text x="81" y="88" text-anchor="middle" class="svg-mono-sm svg-ink-green">S = T</text>
  <text x="81" y="138" text-anchor="middle" class="svg-mono-sm">equal-to</text>

  <!-- equivalent-to -->
  <rect x="152" y="34" width="122" height="122" rx="8" class="svg-node"/>
  <circle cx="210" cy="84" r="24" class="svg-venn-t"/>
  <circle cx="216" cy="84" r="24" class="svg-venn-s-green"/>
  <text x="213" y="88" text-anchor="middle" class="svg-mono-sm svg-ink-green">S ≈ T</text>
  <text x="213" y="138" text-anchor="middle" class="svg-mono-sm">equivalent-to</text>

  <!-- superset-of -->
  <rect x="284" y="34" width="122" height="122" rx="8" class="svg-node"/>
  <circle cx="345" cy="84" r="30" class="svg-venn-s-green"/>
  <circle cx="345" cy="84" r="16" class="svg-venn-t"/>
  <text x="345" y="88" text-anchor="middle" class="svg-mono-sm">T</text>
  <text x="366" y="66" class="svg-mono-xs svg-ink-green">S</text>
  <text x="345" y="138" text-anchor="middle" class="svg-mono-sm">superset-of</text>

  <!-- subset-of -->
  <rect x="424" y="34" width="122" height="122" rx="8" class="svg-node"/>
  <circle cx="485" cy="84" r="30" class="svg-venn-t"/>
  <circle cx="485" cy="84" r="16" class="svg-venn-s-blue"/>
  <text x="485" y="88" text-anchor="middle" class="svg-mono-sm svg-ink-blue">S</text>
  <text x="506" y="66" class="svg-mono-xs">T</text>
  <text x="485" y="138" text-anchor="middle" class="svg-mono-sm">subset-of</text>

  <!-- intersects-with -->
  <rect x="556" y="34" width="122" height="122" rx="8" class="svg-node"/>
  <circle cx="603" cy="84" r="23" class="svg-venn-s-blue"/>
  <circle cx="631" cy="84" r="23" class="svg-venn-t"/>
  <text x="593" y="88" text-anchor="middle" class="svg-mono-sm svg-ink-blue">S</text>
  <text x="641" y="88" text-anchor="middle" class="svg-mono-sm">T</text>
  <text x="617" y="138" text-anchor="middle" class="svg-mono-sm">intersects-with</text>

  <!-- no-relationship -->
  <rect x="692" y="34" width="108" height="122" rx="8" class="svg-node"/>
  <circle cx="726" cy="84" r="17" class="svg-venn-s-muted"/>
  <circle cx="766" cy="84" r="17" class="svg-venn-t"/>
  <text x="726" y="88" text-anchor="middle" class="svg-mono-xs">S</text>
  <text x="766" y="88" text-anchor="middle" class="svg-mono-xs">T</text>
  <text x="746" y="138" text-anchor="middle" class="svg-mono-xs">no-relationship</text>

  <!-- Combined set box -->
  <text x="20" y="190" class="svg-eyebrow">COMBINED COVERAGE  (combined_with_refs)</text>
  <rect x="20" y="202" width="780" height="98" rx="8" class="svg-box-subtle"/>

  <rect x="40" y="220" width="196" height="62" rx="7" class="svg-node"/>
  <text x="138" y="244" text-anchor="middle" class="svg-mono-sm svg-ink-blue">control--ogrl-ac-01</text>
  <text x="138" y="264" text-anchor="middle" class="svg-node-sub">subset-of AC-2#a (reviewed)</text>

  <text x="256" y="256" text-anchor="middle" class="svg-plus">+</text>

  <rect x="276" y="220" width="196" height="62" rx="7" class="svg-node"/>
  <text x="374" y="244" text-anchor="middle" class="svg-mono-sm svg-ink-blue">control--ogrl-ac-02</text>
  <text x="374" y="264" text-anchor="middle" class="svg-node-sub">subset-of AC-2#a (reviewed)</text>

  <text x="502" y="256" text-anchor="middle" class="svg-plus">⇒</text>

  <rect x="530" y="220" width="250" height="62" rx="7" class="svg-node svg-node-green"/>
  <text x="655" y="244" text-anchor="middle" class="svg-mono-sm svg-ink-green">Path to AC-2#a</text>
  <text x="655" y="264" text-anchor="middle" class="svg-node-sub">Covers unit when BOTH controls are met</text>
</svg>`,
  },

  "status-flow": {
    number: "1.5",
    caption: "Deterministic evaluation pipeline for control status (top) and requirement coverage (bottom) at a given evaluation timestamp.",
    html: `<svg viewBox="0 0 840 364" class="rfc-svg" role="img" aria-label="Computed control status and requirement coverage pipeline">
  <defs>
    <marker id="arr-s" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 1 1.5 L 8.5 5 L 1 8.5 z" fill="var(--fg-faint)"/>
    </marker>
  </defs>

  <!-- Control status pipeline -->
  <text x="20" y="22" class="svg-eyebrow">CONTROL STATUS EVALUATION  (PER CONTROL IN EFFECTIVE BASELINE)</text>

  <rect x="20" y="34" width="166" height="126" rx="8" class="svg-node"/>
  <text x="103" y="58" text-anchor="middle" class="svg-node-title">1. Select rows</text>
  <text x="103" y="78" text-anchor="middle" class="svg-node-sub">System impl, or</text>
  <text x="103" y="94" text-anchor="middle" class="svg-node-sub">inherited component</text>
  <text x="103" y="110" text-anchor="middle" class="svg-node-sub">rows (+ provider's</text>
  <text x="103" y="126" text-anchor="middle" class="svg-node-sub">half if shared)</text>

  <line x1="186" y1="97" x2="216" y2="97" class="svg-edge" marker-end="url(#arr-s)"/>

  <rect x="218" y="34" width="332" height="126" rx="8" class="svg-node"/>
  <text x="236" y="56" class="svg-node-title">2. Verify all 6 met gates</text>
  <text x="236" y="76" class="svg-mono-xs">✓ status == implemented</text>
  <text x="236" y="92" class="svg-mono-xs">✓ responsibility eligible for origin</text>
  <text x="236" y="108" class="svg-mono-xs">✓ all statement parameters resolved</text>
  <text x="236" y="124" class="svg-mono-xs">✓ all applicable required tests passing &amp; fresh</text>
  <text x="236" y="140" class="svg-mono-xs">✓ cited/floor evidence complete &amp; unexpired</text>
  <text x="236" y="153" class="svg-mono-xs">✓ provider's half (if present) holds</text>

  <line x1="550" y1="54" x2="612" y2="54" class="svg-edge" marker-end="url(#arr-s)"/>
  <line x1="550" y1="84" x2="612" y2="84" class="svg-edge" marker-end="url(#arr-s)"/>
  <line x1="550" y1="114" x2="612" y2="114" class="svg-edge" marker-end="url(#arr-s)"/>
  <line x1="550" y1="144" x2="612" y2="144" class="svg-edge" marker-end="url(#arr-s)"/>

  <rect x="614" y="38" width="206" height="28" rx="6" class="svg-pill-green"/>
  <text x="717" y="56" text-anchor="middle" class="svg-mono-sm svg-ink-green">met  (all gates pass)</text>

  <rect x="614" y="70" width="206" height="28" rx="6" class="svg-pill-amber"/>
  <text x="717" y="88" text-anchor="middle" class="svg-mono-sm svg-ink-amber">waived  (active exception)</text>

  <rect x="614" y="102" width="206" height="28" rx="6" class="svg-pill-muted"/>
  <text x="717" y="120" text-anchor="middle" class="svg-mono-sm">out-of-scope  (N/A / cust.)</text>

  <rect x="614" y="134" width="206" height="28" rx="6" class="svg-pill-red"/>
  <text x="717" y="152" text-anchor="middle" class="svg-mono-sm svg-ink-red">gap  (names failed gate)</text>

  <!-- Requirement coverage ladder -->
  <text x="20" y="206" class="svg-eyebrow">REQUIREMENT COVERAGE  (FIRST MATCH WINS OVER LEAF PARTS / UNITS)</text>

  <rect x="20" y="218" width="184" height="126" rx="8" class="svg-node"/>
  <rect x="34" y="232" width="108" height="24" rx="5" class="svg-pill-muted"/>
  <text x="88" y="248" text-anchor="middle" class="svg-mono-sm">unmapped</text>
  <text x="34" y="278" class="svg-node-sub">No reviewed mapping</text>
  <text x="34" y="294" class="svg-node-sub">from any baseline</text>
  <text x="34" y="310" class="svg-node-sub">control reaches any</text>
  <text x="34" y="326" class="svg-node-sub">leaf unit.</text>

  <line x1="204" y1="281" x2="226" y2="281" class="svg-edge" marker-end="url(#arr-s)"/>

  <rect x="228" y="218" width="184" height="126" rx="8" class="svg-node"/>
  <rect x="242" y="232" width="124" height="24" rx="5" class="svg-pill-blue"/>
  <text x="304" y="248" text-anchor="middle" class="svg-mono-sm svg-ink-blue">contribution</text>
  <text x="242" y="278" class="svg-node-sub">At least one unit has</text>
  <text x="242" y="294" class="svg-node-sub">no full-coverage path</text>
  <text x="242" y="310" class="svg-node-sub">(single or combined</text>
  <text x="242" y="326" class="svg-node-sub">set).</text>

  <line x1="412" y1="281" x2="434" y2="281" class="svg-edge" marker-end="url(#arr-s)"/>

  <rect x="436" y="218" width="184" height="126" rx="8" class="svg-node"/>
  <rect x="450" y="232" width="76" height="24" rx="5" class="svg-pill-red"/>
  <text x="488" y="248" text-anchor="middle" class="svg-mono-sm svg-ink-red">gap</text>
  <text x="450" y="278" class="svg-node-sub">Every unit has a path,</text>
  <text x="450" y="294" class="svg-node-sub">but ≥ 1 unit has no</text>
  <text x="450" y="310" class="svg-node-sub">path whose source</text>
  <text x="450" y="326" class="svg-node-sub">controls are all met.</text>

  <line x1="620" y1="281" x2="642" y2="281" class="svg-edge" marker-end="url(#arr-s)"/>

  <rect x="644" y="218" width="176" height="126" rx="8" class="svg-node svg-node-green"/>
  <rect x="658" y="232" width="96" height="24" rx="5" class="svg-pill-green"/>
  <text x="706" y="248" text-anchor="middle" class="svg-mono-sm svg-ink-green">covered</text>
  <text x="658" y="278" class="svg-node-sub">Every leaf unit has at</text>
  <text x="658" y="294" class="svg-node-sub">least one path whose</text>
  <text x="658" y="310" class="svg-node-sub">controls are all met.</text>
</svg>`,
  },

  "status-explorer": {
    number: "1.6",
    caption: "Interactive Section 8 evaluator: adjust implementation inputs to see the deterministic control state and exact rule applied.",
    html: `<div class="status-explorer" data-status-explorer>
  <div class="se-grid">
    <label class="se-field">
      <span class="se-label">origin</span>
      <select data-se="origin">
        <option value="organization" selected>organization</option>
        <option value="provider">provider</option>
      </select>
    </label>
    <label class="se-field">
      <span class="se-label">implementation.status</span>
      <select data-se="status">
        <option value="implemented" selected>implemented</option>
        <option value="planned">planned</option>
        <option value="partial">partial</option>
        <option value="not-applicable">not-applicable</option>
        <option value="exception">exception</option>
      </select>
    </label>
    <label class="se-field">
      <span class="se-label">responsibility</span>
      <select data-se="responsibility">
        <option value="provider" selected>provider</option>
        <option value="shared">shared</option>
        <option value="customer">customer</option>
        <option value="subservice">subservice</option>
      </select>
    </label>
    <label class="se-field">
      <span class="se-label">parameters</span>
      <select data-se="params">
        <option value="resolved" selected>all resolved</option>
        <option value="unset">one or more unset</option>
      </select>
    </label>
    <label class="se-field">
      <span class="se-label">required test</span>
      <select data-se="test">
        <option value="pass-fresh" selected>passing (within window)</option>
        <option value="pass-stale">passing (stale / expired)</option>
        <option value="fail">fail / error / skip</option>
        <option value="no-methodology">automated, no run / fulfillment</option>
        <option value="none">no required test</option>
      </select>
    </label>
    <label class="se-field">
      <span class="se-label">evidence</span>
      <select data-se="evidence">
        <option value="valid" selected>complete &amp; unexpired</option>
        <option value="expired">expired (valid_until &lt; eval date)</option>
        <option value="incomplete">incomplete (missing digest)</option>
        <option value="none">none attached</option>
      </select>
    </label>
    <label class="se-field">
      <span class="se-label">exception record</span>
      <select data-se="exception">
        <option value="active" selected>active (unexpired)</option>
        <option value="expired">expired or missing</option>
      </select>
    </label>
  </div>
  <div class="se-output" aria-live="polite">
    <div class="se-output-head">
      <span class="se-output-label">Computed control state</span>
      <span class="se-badge se-badge--met" data-se-badge>met</span>
    </div>
    <p class="se-reason" data-se-reason>All six Section 8 conditions hold: implemented, eligible responsibility, parameters resolved, required test passing within freshness window, and complete unexpired evidence.</p>
  </div>
</div>`,
  },

  "authority-flow": {
    number: "2.1",
    caption: "Authority boundaries and data flow across the four copies in an OGRL deployment. Git and OSCAL exports are strictly one-way; restore runs only into an empty database.",
    html: `<svg viewBox="0 0 880 364" class="rfc-svg" role="img" aria-label="OGRL sources of truth and data flow">
  <defs>
    <marker id="arr-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 1 1.5 L 8.5 5 L 1 8.5 z" fill="var(--fg-faint)"/>
    </marker>
    <marker id="arr-ag" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 1 1.5 L 8.5 5 L 1 8.5 z" fill="var(--met)"/>
    </marker>
    <marker id="arr-aa" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 1 1.5 L 8.5 5 L 1 8.5 z" fill="var(--waived)"/>
    </marker>
  </defs>

  <!-- Column 1: Upstream Sources -->
  <rect x="18" y="24" width="206" height="118" rx="8" class="svg-node svg-node-accent"/>
  <text x="34" y="46" class="svg-eyebrow svg-ink-blue">SOURCE OF TRUTH</text>
  <text x="34" y="68" class="svg-node-title">OGRL Repository</text>
  <text x="34" y="88" class="svg-node-sub">library/ YAML: frameworks,</text>
  <text x="34" y="104" class="svg-node-sub">requirements, standard controls,</text>
  <text x="34" y="120" class="svg-node-sub">mappings, baselines, tests</text>

  <rect x="18" y="176" width="206" height="118" rx="8" class="svg-node"/>
  <text x="34" y="198" class="svg-eyebrow">SOURCE OF TRUTH</text>
  <text x="34" y="220" class="svg-node-title">Provider Publications</text>
  <text x="34" y="240" class="svg-node-sub">OGRL provider bundles or</text>
  <text x="34" y="256" class="svg-node-sub">OSCAL component definitions</text>
  <text x="34" y="272" class="svg-node-sub">(party, component, impls)</text>

  <!-- Column 2: Org Database -->
  <rect x="304" y="24" width="268" height="270" rx="10" class="svg-zone-org"/>
  <text x="322" y="46" class="svg-eyebrow svg-ink-green">SYSTEM OF RECORD</text>
  <text x="322" y="68" class="svg-node-title">Organization Database</text>

  <rect x="322" y="84" width="232" height="44" rx="6" class="svg-node"/>
  <text x="336" y="103" class="svg-mono-sm svg-ink-blue">Library projection</text>
  <text x="336" y="119" class="svg-node-sub">Read-only · pinned to commit</text>

  <rect x="322" y="138" width="232" height="44" rx="6" class="svg-node"/>
  <text x="336" y="157" class="svg-mono-sm">Provider projections</text>
  <text x="336" y="173" class="svg-node-sub">Read-only · pinned by digest</text>

  <rect x="322" y="192" width="232" height="52" rx="6" class="svg-node svg-node-green"/>
  <text x="336" y="212" class="svg-mono-sm svg-ink-green">Organization objects</text>
  <text x="336" y="228" class="svg-node-sub">Writable · full revision history</text>

  <text x="322" y="272" class="svg-node-sub">+ Object Storage for artifact blobs (SHA-256)</text>

  <!-- Column 3: Exports -->
  <rect x="652" y="24" width="190" height="126" rx="8" class="svg-node"/>
  <text x="668" y="46" class="svg-eyebrow">ONE-WAY SNAPSHOT</text>
  <text x="668" y="68" class="svg-node-title">Org Git Repository</text>
  <text x="668" y="88" class="svg-node-sub">Current org YAML, pins,</text>
  <text x="668" y="104" class="svg-node-sub">provider copies, policy</text>
  <text x="668" y="120" class="svg-node-sub">Markdown bodies</text>

  <rect x="652" y="176" width="190" height="118" rx="8" class="svg-node"/>
  <text x="668" y="198" class="svg-eyebrow">DISPOSABLE RENDER</text>
  <text x="668" y="220" class="svg-node-title">OSCAL 1.2.3 Package</text>
  <text x="668" y="240" class="svg-node-sub">Profile, SSP, mappings,</text>
  <text x="668" y="256" class="svg-node-sub">components, assessment</text>
  <text x="668" y="272" class="svg-node-sub">results, POA&amp;M (JSON/XML)</text>

  <!-- Arrows -->
  <line x1="224" y1="104" x2="320" y2="104" class="svg-edge" marker-end="url(#arr-a)"/>
  <text x="266" y="96" text-anchor="middle" class="svg-mono-xs">pull</text>

  <line x1="224" y1="210" x2="266" y2="210" class="svg-edge"/>
  <path d="M 266 210 L 266 160 L 320 160" class="svg-edge" fill="none" marker-end="url(#arr-a)"/>
  <text x="264" y="226" text-anchor="middle" class="svg-mono-xs">import</text>

  <line x1="572" y1="90" x2="650" y2="90" class="svg-edge-green" marker-end="url(#arr-ag)"/>
  <text x="612" y="82" text-anchor="middle" class="svg-mono-xs svg-ink-green">export</text>

  <line x1="572" y1="230" x2="650" y2="230" class="svg-edge" marker-end="url(#arr-a)"/>
  <text x="612" y="222" text-anchor="middle" class="svg-mono-xs">render</text>

  <!-- One-time restore arrow routed cleanly outside the right edge -->
  <path d="M 842 88 L 862 88 L 862 332 L 438 332 L 438 296" class="svg-edge-amber" fill="none" stroke-dasharray="5 4" marker-end="url(#arr-aa)"/>
  <text x="650" y="324" text-anchor="middle" class="svg-mono-xs svg-ink-amber">restore  (one-time only, into an empty database)</text>
</svg>`,
  },

  "review-staleness": {
    number: "2.2",
    caption: "Lifecycle of a mapping_review across library pulls: upstream changes invalidate prior reviews automatically without touching organization records.",
    html: `<svg viewBox="0 0 840 206" class="rfc-svg" role="img" aria-label="Mapping review staleness across library pulls">
  <defs>
    <marker id="arr-t" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 1 1.5 L 8.5 5 L 1 8.5 z" fill="var(--fg-faint)"/>
    </marker>
  </defs>

  <!-- Timeline axis -->
  <line x1="36" y1="42" x2="804" y2="42" class="svg-edge" marker-end="url(#arr-t)"/>

  <!-- Step 1 -->
  <circle cx="110" cy="42" r="6" fill="var(--contribution)"/>
  <text x="110" y="24" text-anchor="middle" class="svg-mono-xs">T1 · PULL v0.1.0</text>
  <rect x="20" y="62" width="180" height="122" rx="8" class="svg-node"/>
  <text x="34" y="84" class="svg-node-title">Mapping arrives</text>
  <text x="34" y="104" class="svg-mono-xs">relationship: subset-of</text>
  <text x="34" y="120" class="svg-mono-xs">review_status: draft</text>
  <text x="34" y="136" class="svg-mono-xs">modified: 10-22</text>
  <rect x="34" y="148" width="96" height="22" rx="4" class="svg-pill-muted"/>
  <text x="82" y="163" text-anchor="middle" class="svg-mono-xs">unreviewed</text>

  <!-- Step 2 -->
  <circle cx="316" cy="42" r="6" fill="var(--met)"/>
  <text x="316" y="24" text-anchor="middle" class="svg-mono-xs">T2 · ORG REVIEWS</text>
  <rect x="226" y="62" width="180" height="122" rx="8" class="svg-node svg-node-green"/>
  <text x="240" y="84" class="svg-node-title">mapping_review</text>
  <text x="240" y="104" class="svg-mono-xs">review_status: reviewed</text>
  <text x="240" y="120" class="svg-mono-xs">mapping_modified: 10-22</text>
  <text x="240" y="136" class="svg-node-sub">matches mapping.modified</text>
  <rect x="240" y="148" width="116" height="22" rx="4" class="svg-pill-green"/>
  <text x="298" y="163" text-anchor="middle" class="svg-mono-xs svg-ink-green">current · counts</text>

  <!-- Step 3 -->
  <circle cx="522" cy="42" r="6" fill="var(--waived)"/>
  <text x="522" y="24" text-anchor="middle" class="svg-mono-xs">T3 · PULL v0.2.0</text>
  <rect x="432" y="62" width="180" height="122" rx="8" class="svg-node svg-node-amber"/>
  <text x="446" y="84" class="svg-node-title">Upstream changes</text>
  <text x="446" y="104" class="svg-mono-xs">relationship: equal-to</text>
  <text x="446" y="120" class="svg-mono-xs">modified: 12-01</text>
  <text x="446" y="136" class="svg-node-sub">10-22 ≠ 12-01</text>
  <rect x="446" y="148" width="128" height="22" rx="4" class="svg-pill-amber"/>
  <text x="510" y="163" text-anchor="middle" class="svg-mono-xs svg-ink-amber">review now stale</text>

  <!-- Step 4 -->
  <circle cx="728" cy="42" r="6" fill="var(--fg-muted)"/>
  <text x="728" y="24" text-anchor="middle" class="svg-mono-xs">T4 · EFFECT</text>
  <rect x="638" y="62" width="182" height="122" rx="8" class="svg-node"/>
  <text x="652" y="84" class="svg-node-title">Re-review required</text>
  <text x="652" y="104" class="svg-node-sub">Old review kept for audit</text>
  <text x="652" y="120" class="svg-node-sub">history, stops applying;</text>
  <text x="652" y="136" class="svg-node-sub">surfaced in pull report.</text>
  <rect x="652" y="148" width="126" height="22" rx="4" class="svg-pill-muted"/>
  <text x="715" y="163" text-anchor="middle" class="svg-mono-xs">back to unreviewed</text>
</svg>`,
  },

  "shared-responsibility": {
    number: "2.3",
    caption: "How provider-authored component rows interact with organization implementations during Section 8 status evaluation.",
    html: `<svg viewBox="0 0 840 248" class="rfc-svg" role="img" aria-label="Provider inheritance and shared responsibility patterns">
  <!-- Case A -->
  <rect x="18" y="16" width="256" height="216" rx="8" class="svg-node"/>
  <text x="34" y="40" class="svg-eyebrow svg-ink-green">A · FULLY INHERITED</text>
  <rect x="34" y="54" width="224" height="62" rx="6" class="svg-box-subtle"/>
  <text x="46" y="74" class="svg-mono-xs">origin: provider</text>
  <text x="46" y="90" class="svg-mono-xs">responsibility: provider</text>
  <text x="46" y="106" class="svg-node-sub">+ unexpired SOC 2 / FedRAMP report</text>
  <text x="146" y="140" text-anchor="middle" class="svg-node-sub">No system row needed</text>
  <rect x="34" y="166" width="224" height="46" rx="6" class="svg-pill-green"/>
  <text x="146" y="186" text-anchor="middle" class="svg-mono-sm svg-ink-green">met</text>
  <text x="146" y="202" text-anchor="middle" class="svg-node-sub">Report satisfies unfulfilled library tests</text>

  <!-- Case B -->
  <rect x="292" y="16" width="256" height="216" rx="8" class="svg-node"/>
  <text x="308" y="40" class="svg-eyebrow svg-ink-blue">B · SHARED CONTROL</text>
  <rect x="308" y="54" width="224" height="46" rx="6" class="svg-box-subtle"/>
  <text x="320" y="73" class="svg-mono-xs">Provider's half (component_ref)</text>
  <text x="320" y="89" class="svg-node-sub">origin: provider · responsibility: shared</text>
  <text x="420" y="114" text-anchor="middle" class="svg-mono-xs svg-muted">+ evaluated alongside</text>
  <rect x="308" y="122" width="224" height="44" rx="6" class="svg-node svg-node-accent"/>
  <text x="320" y="141" class="svg-mono-xs svg-ink-blue">Org's half (system_ref)</text>
  <text x="320" y="157" class="svg-node-sub">Covers customer_responsibility</text>
  <rect x="308" y="180" width="224" height="32" rx="6" class="svg-pill-green"/>
  <text x="420" y="200" text-anchor="middle" class="svg-mono-xs svg-ink-green">met only when BOTH halves hold</text>

  <!-- Case C -->
  <rect x="566" y="16" width="256" height="216" rx="8" class="svg-node"/>
  <text x="582" y="40" class="svg-eyebrow svg-ink-amber">C · SYSTEM OVERRIDE</text>
  <rect x="582" y="54" width="224" height="46" rx="6" class="svg-box-subtle" stroke-dasharray="4 3"/>
  <text x="594" y="73" class="svg-mono-xs svg-muted">Provider row (component_ref)</text>
  <text x="594" y="89" class="svg-node-sub">Bypassed for this system</text>
  <text x="694" y="114" text-anchor="middle" class="svg-mono-xs svg-ink-amber">replaced by ↓</text>
  <rect x="582" y="122" width="224" height="44" rx="6" class="svg-node svg-node-amber"/>
  <text x="594" y="141" class="svg-mono-xs svg-ink-amber">Org override (system + component)</text>
  <text x="594" y="157" class="svg-node-sub">Takes full ownership for this system</text>
  <rect x="582" y="180" width="224" height="32" rx="6" class="svg-pill-muted"/>
  <text x="694" y="200" text-anchor="middle" class="svg-mono-xs">Evaluated on org row alone</text>
</svg>`,
  },

  "oscal-fanout": {
    number: "2.4",
    caption: "One-way OSCAL 1.2.3 export: a single OGRL graph projects out into six synchronized federal artifacts (JSON and XML) for one system and one target NIST framework.",
    html: `<svg viewBox="0 0 880 310" class="rfc-svg" role="img" aria-label="OSCAL 1.2.3 export fan-out from OGRL graph">
  <defs>
    <marker id="arr-o" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 1 1.5 L 8.5 5 L 1 8.5 z" fill="var(--fg-faint)"/>
    </marker>
  </defs>

  <!-- Source graph box -->
  <rect x="18" y="30" width="290" height="250" rx="10" class="svg-zone-org"/>
  <text x="36" y="54" class="svg-eyebrow svg-ink-blue">OGRL DATABASE + PINNED LIBRARY</text>
  <text x="36" y="76" class="svg-node-title">One System × Target NIST Catalog</text>
  <text x="36" y="104" class="svg-mono-xs">• system, program, effective baseline</text>
  <text x="36" y="124" class="svg-mono-xs">• system &amp; component implementations</text>
  <text x="36" y="144" class="svg-mono-xs">• library &amp; org mappings + reviews</text>
  <text x="36" y="164" class="svg-mono-xs">• resolved parameter bindings</text>
  <text x="36" y="184" class="svg-mono-xs">• findings in force &amp; evidence hashes</text>
  <text x="36" y="204" class="svg-mono-xs">• open risks (milestones) &amp; exceptions</text>
  <rect x="36" y="228" width="254" height="32" rx="6" class="svg-pill-muted"/>
  <text x="163" y="248" text-anchor="middle" class="svg-mono-xs">Read-only render · never re-imported</text>

  <!-- Spine -->
  <line x1="308" y1="155" x2="362" y2="155" class="svg-edge"/>
  <line x1="362" y1="36" x2="362" y2="274" class="svg-edge"/>

  <!-- 6 outputs -->
  <line x1="362" y1="36" x2="404" y2="36" class="svg-edge" marker-end="url(#arr-o)"/>
  <rect x="406" y="18" width="456" height="36" rx="6" class="svg-node"/>
  <text x="422" y="40" class="svg-mono-sm svg-ink-blue">oscal/profile.json</text>
  <text x="846" y="40" text-anchor="end" class="svg-node-sub">In-scope requirements + set-parameter</text>

  <line x1="362" y1="84" x2="404" y2="84" class="svg-edge" marker-end="url(#arr-o)"/>
  <rect x="406" y="66" width="456" height="36" rx="6" class="svg-node svg-node-green"/>
  <text x="422" y="88" class="svg-mono-sm svg-ink-green">oscal/ssp.json</text>
  <text x="846" y="88" text-anchor="end" class="svg-node-sub">System characteristics + implemented-reqs</text>

  <line x1="362" y1="132" x2="404" y2="132" class="svg-edge" marker-end="url(#arr-o)"/>
  <rect x="406" y="114" width="456" height="36" rx="6" class="svg-node"/>
  <text x="422" y="136" class="svg-mono-sm">oscal/mapping-collection.json</text>
  <text x="846" y="136" text-anchor="end" class="svg-node-sub">Crosswalk + review &amp; param props</text>

  <line x1="362" y1="180" x2="404" y2="180" class="svg-edge" marker-end="url(#arr-o)"/>
  <rect x="406" y="162" width="456" height="36" rx="6" class="svg-node"/>
  <text x="422" y="184" class="svg-mono-sm">oscal/component-definition.json</text>
  <text x="846" y="184" text-anchor="end" class="svg-node-sub">Reusable component statements</text>

  <line x1="362" y1="228" x2="404" y2="228" class="svg-edge" marker-end="url(#arr-o)"/>
  <rect x="406" y="210" width="456" height="36" rx="6" class="svg-node"/>
  <text x="422" y="232" class="svg-mono-sm">oscal/assessment-results.json</text>
  <text x="846" y="232" text-anchor="end" class="svg-node-sub">Findings + back-matter evidence</text>

  <line x1="362" y1="274" x2="404" y2="274" class="svg-edge" marker-end="url(#arr-o)"/>
  <rect x="406" y="256" width="456" height="36" rx="6" class="svg-node svg-node-amber"/>
  <text x="422" y="278" class="svg-mono-sm svg-ink-amber">oscal/poam.json</text>
  <text x="846" y="278" text-anchor="end" class="svg-node-sub">Open risks, exceptions, not-satisfied</text>
</svg>`,
  },
};

export function renderFigure(id) {
  const fig = FIGURES[id];
  if (!fig) {
    throw new Error(`Unknown figure id: ${id}`);
  }
  return `<figure class="rfc-figure" id="fig-${id}">
  <div class="rfc-figure-body">${fig.html}</div>
  <figcaption class="rfc-figcaption"><span class="fig-num">Fig ${fig.number}</span> ${fig.caption}</figcaption>
</figure>`;
}
