function esc(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const OGRL_MARK_SVG = `<svg viewBox="0 0 32 32" width="24" height="24" fill="none" aria-hidden="true"><path d="M26.2 16V20.2C26.2 23.51 23.51 26.2 20.2 26.2H11.8C8.49 26.2 5.8 23.51 5.8 20.2V11.8C5.8 8.49 8.49 5.8 11.8 5.8H20.2C22.4 5.8 24.32 6.98 25.36 8.75" stroke="currentColor" stroke-width="3.8" stroke-linecap="butt"/><path d="M15.2 16H28.1" stroke="currentColor" stroke-width="3.8" stroke-linecap="butt"/></svg>`;

const THEME_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/></svg>`;

const THEME_INIT_SCRIPT = `<script>(function(){try{var s=localStorage.getItem("ogrl-rfcs-theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();</script>`;

function formatFrameworkSource(fw) {
  const src = fw.source;
  if (src?.commit) {
    return `OSCAL commit <code>${esc(src.commit.slice(0, 8))}</code>`;
  }
  if (fw.reproduction === "permitted" && src?.sha256) {
    return `Pinned source <code title="${esc(src.sha256)}">${esc(src.sha256.slice(0, 12))}…</code>`;
  }
  if (fw.reproduction === "citation-only") {
    return "Citation-only identifiers (RFC 0001 §10)";
  }
  if (fw.reproduction === "permitted") {
    return "Reproduction permitted (RFC 0001 §10)";
  }
  return esc(fw.reproduction || "unknown");
}

function renderHeader(rfcs, currentSlug, activeNav = "index") {
  const navItems = rfcs
    .map(
      (r) =>
        `<a class="nav-link" href="/rfcs/${r.slug}/"${r.slug === currentSlug ? ' aria-current="page"' : ""}>${esc(r.number)}</a>`,
    )
    .join("");

  const rawBtn = currentSlug
    ? `<a class="icon-btn" href="/rfcs/${currentSlug}.md" title="Download raw Markdown">Raw .md</a>`
    : activeNav === "library"
      ? `<a class="icon-btn" href="/library/catalog.json" title="Download catalog JSON">catalog.json</a>`
      : "";

  return `<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="/">
      <span class="brand-mark">${OGRL_MARK_SVG}</span>
      <span class="brand-wordmark">OGRL</span>
      <span class="brand-sep">/</span>
      <span class="brand-sub">${activeNav === "library" ? "Library" : "RFCs"}</span>
    </a>
    <nav class="header-nav" aria-label="Primary">
      <a class="nav-link" href="/"${activeNav === "index" ? ' aria-current="page"' : ""}>Index</a>
      ${navItems}
      <a class="nav-link" href="/library/"${activeNav === "library" ? ' aria-current="page"' : ""}>Library</a>
    </nav>
    <div class="header-actions">
      ${rawBtn}
      <button id="theme-toggle" class="icon-btn icon-btn--square" type="button" aria-label="Toggle color theme">${THEME_SVG}</button>
    </div>
  </div>
</header>`;
}

function renderShell({ title, description, rfcs, currentSlug, activeNav = "index", body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Geist:wght@400;500;600&family=Spectral:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet" />
  ${THEME_INIT_SCRIPT}
  <link rel="stylesheet" href="/assets/styles.css" />
</head>
<body>
  ${renderHeader(rfcs, currentSlug, activeNav)}
  ${body}
  <footer class="site-footer">
    <div class="footer-inner">
      <span>OGRL · Open Governance Reference Language · Spec 0.2.0</span>
      <span>Drafted with AI assistance; human review in progress · <a href="https://github.com/adversitydotdev/ogrl-rfcs#ai-assistance" target="_blank" rel="noopener noreferrer">Details</a></span>
      <span class="footer-links">
        <a href="/">RFCs</a>
        <span aria-hidden="true">·</span>
        <a href="/library/">Library Catalog</a>
        <span aria-hidden="true">·</span>
        <a href="https://github.com/adversitydotdev/ogrl-library" target="_blank" rel="noopener noreferrer">ogrl-library</a>
        <span aria-hidden="true">·</span>
        <a href="https://github.com/adversitydotdev/ogrl-rs" target="_blank" rel="noopener noreferrer">ogrl-rs</a>
      </span>
    </div>
  </footer>
  <script src="/assets/client.js" defer></script>
</body>
</html>`;
}

export function renderIndexPage(rfcs, catalog = null) {
  const libRole = catalog
    ? `${catalog.counts.frameworks} frameworks, ${catalog.counts.controls || 0} standard controls, ${catalog.counts.baselines || 0} baselines, ${catalog.counts.requirements.toLocaleString("en-US")} requirements, and ${catalog.counts.objectives.toLocaleString("en-US")} assessment objectives.`
    : "Shared frameworks, standard controls, baselines, requirements, assessment objectives, and crosswalk mappings.";

  const layers = [
    {
      step: "RFC 0001",
      href: "/rfcs/0001-object-model/",
      name: "Object Model",
      role: "Typed graph, YAML/JSON forms, constraints, and deterministic computed status.",
    },
    {
      step: "RFC 0002",
      href: "/rfcs/0002-tooling/",
      name: "Tooling & Sources of Truth",
      role: "Authority boundaries, library pulls, provider bundles, Git snapshots, and OSCAL export.",
    },
    {
      step: "Catalog",
      href: "/library/",
      name: "Standard Library",
      role: libRole,
    },
  ];

  const layerStrip = `<section class="layer-strip" aria-label="OGRL architecture and catalog">
  ${layers
    .map(
      (l) => `<a class="layer-card" href="${l.href}">
    <div class="layer-step">${esc(l.step)}</div>
    <div class="layer-name">${esc(l.name)}</div>
    <div class="layer-role">${esc(l.role)}</div>
  </a>`,
    )
    .join("\n")}
</section>`;

  const rows = rfcs
    .map((r) => {
      const deps =
        r.dependsOn.length > 0
          ? `<span>Depends on ${r.dependsOn
              .map((d) => `<a href="/rfcs/${d.slug}/">${esc(d.label)}</a>`)
              .join(", ")}</span>`
          : `<span>Foundation spec</span>`;

      return `<article class="rfc-row">
  <div class="rfc-row-num">RFC ${esc(r.number)}</div>
  <div>
    <h2 class="rfc-row-title"><a href="/rfcs/${r.slug}/">${esc(r.shortTitle)}</a></h2>
    <p class="rfc-row-summary">${esc(r.summary)}</p>
    <div class="rfc-row-meta">
      <span class="status-pill">${esc(r.meta.Status || "Draft")}</span>
      <span>v${esc(r.meta["Spec version"] || "0.1.0")}</span>
      <span>${esc(r.meta.Date || "")}</span>
      <span>${r.readingMinutes} min read</span>
      ${deps}
    </div>
  </div>
  <div class="rfc-row-actions">
    <a class="icon-btn" href="/rfcs/${r.slug}.md">Raw .md</a>
  </div>
</article>`;
    })
    .join("\n");

  const libraryCallout = catalog
    ? `<h2 class="section-heading section-heading--spaced">Standard Library</h2>
  <section class="rfc-list" aria-label="Standard library catalog">
    <article class="rfc-row">
      <div class="rfc-row-num">LIB v${esc(catalog.bundle.version)}</div>
      <div>
        <h2 class="rfc-row-title"><a href="/library/">OGRL Control &amp; Framework Catalog</a></h2>
        <p class="rfc-row-summary">
          Browse ${catalog.counts.controls || 0} standard OGRL controls, ${catalog.counts.baselines || 0} starter
          baselines, ${catalog.counts.requirements.toLocaleString("en-US")} requirements, and
          ${catalog.counts.objectives.toLocaleString("en-US")} NIST assessment objectives across
          ${catalog.frameworks.map((f) => esc(f.name)).join(", ")}, with
          ${catalog.counts.reviewed_mappings || 0} reviewed control crosswalks and
          ${catalog.counts.draft_mappings ?? catalog.counts.mappings} draft links.
        </p>
        <div class="rfc-row-meta">
          <span class="status-pill">${esc(catalog.bundle.id)}</span>
          <span>v${esc(catalog.bundle.version)}</span>
          <span>Spec ${esc(catalog.bundle.spec_version)}</span>
          <span><a href="${esc(catalog.bundle.repo_url)}" target="_blank" rel="noopener noreferrer">ogrl-library ↗</a></span>
          <span><a href="${esc(catalog.bundle.tools_repo_url)}" target="_blank" rel="noopener noreferrer">ogrl-rs CLI ↗</a></span>
        </div>
      </div>
      <div class="rfc-row-actions">
        <a class="icon-btn" href="/library/">Browse →</a>
      </div>
    </article>
  </section>`
    : "";

  const pronunciationSection = `<h2 class="section-heading section-heading--spaced">Pronunciation</h2>
  <section class="pronounce-card" aria-label="How to pronounce OGRL">
    <div class="pronounce-head">
      <span class="pronounce-word">OGRL</span>
      <span class="pronounce-respell">&ldquo;oh-girl&rdquo;</span>
      <span class="pronounce-ipa">/&#x02C8;o&#x028A;.&#x0261;&#x025C;&#x02D0;rl/</span>
    </div>
    <p class="pronounce-note">
      Short for <strong>Open Governance Reference Language</strong>. Pronounced as a two-syllable word&mdash;<em>oh-girl</em>&mdash;rather
      than spelled out letter by letter.
    </p>
  </section>`;

  const body = `<section class="hero-band">
  <div class="hero-inner">
    <p class="eyebrow">Open Governance Reference Language · Request for Comments</p>
    <h1 class="hero-title">Specifications for an open security program.</h1>
    <p class="hero-lede">
      OGRL defines a portable, graph-based language for security controls, framework crosswalks,
      implementations, tests, and evidence—along with the authority and exchange rules that let
      a security program move cleanly between tools without vendor lock-in.
    </p>
  </div>
</section>
<main class="index-main">
  ${layerStrip}
  <h2 class="section-heading">Specifications (${rfcs.length})</h2>
  <section class="rfc-list" aria-label="RFC list">
    ${rows}
  </section>
  ${libraryCallout}
  ${pronunciationSection}
</main>`;

  return renderShell({
    title: "OGRL RFCs — Open Governance Reference Language Specifications",
    description:
      "Request for Comments specifications and standard library catalog for OGRL (Open Governance Reference Language).",
    rfcs,
    currentSlug: null,
    activeNav: "index",
    body,
  });
}

export function renderLibraryPage(rfcs, catalog) {
  const { bundle, counts, frameworks, baselines = [], controls = [] } = catalog;
  const shortDigest = bundle.digest ? `${bundle.digest.slice(0, 20)}…` : "";
  const repoBase = bundle.repo_url.replace(/\/$/, "");

  const metaItems = [
    { label: "Bundle", html: `<code>${esc(bundle.id)}</code>` },
    { label: "Version", html: esc(bundle.version) },
    { label: "Frameworks", html: String(counts.frameworks) },
    { label: "Standard controls", html: String(counts.controls || 0) },
    { label: "Baselines", html: String(counts.baselines || 0) },
    { label: "Library tests", html: String(counts.tests || 0) },
    {
      label: "Requirements",
      html: `${counts.requirements.toLocaleString("en-US")} (${counts.withdrawn_requirements} withdrawn)`,
    },
    { label: "Objectives", html: counts.objectives.toLocaleString("en-US") },
    {
      label: "Mappings",
      html: `${counts.mappings.toLocaleString("en-US")} (${counts.reviewed_mappings || 0} reviewed)`,
    },
  ];
  if (shortDigest) {
    metaItems.push({
      label: "Projection digest",
      html: `<code title="${esc(bundle.digest)}">${esc(shortDigest)}</code>`,
    });
  }

  const fwCards = frameworks
    .map((fw) => {
      return `<button type="button" class="lib-fw-card" data-lib-fw="${esc(fw.slug)}">
  <div class="lib-fw-top">
    <span class="layer-step">${esc(fw.publisher)} · v${esc(fw.version)}</span>
    <span class="status-pill">${esc(fw.reproduction)}</span>
  </div>
  <div class="lib-fw-name">${esc(fw.name)}</div>
  <div class="lib-fw-id"><code>${esc(fw.id)}</code></div>
  <div class="lib-fw-stats">
    <span><strong>${fw.active_count.toLocaleString("en-US")}</strong> active</span>
    ${fw.withdrawn_count > 0 ? `<span><strong>${fw.withdrawn_count}</strong> withdrawn</span>` : ""}
    ${fw.objective_count > 0 ? `<span><strong>${fw.objective_count.toLocaleString("en-US")}</strong> objectives</span>` : ""}
    <span><strong>${fw.mapping_count}</strong> mappings</span>
  </div>
  <div class="lib-fw-source">${formatFrameworkSource(fw)}</div>
</button>`;
    })
    .join("\n");

  const baselineCards = baselines
    .map((b) => {
      const yamlHref = `${repoBase}/blob/main/${b.yaml_path}`;
      return `<a class="lib-baseline-card" href="${esc(yamlHref)}" target="_blank" rel="noopener noreferrer">
  <div class="lib-fw-top">
    <span class="layer-step">Library baseline</span>
    <span class="lib-tag">${b.control_refs.length} controls</span>
  </div>
  <div class="lib-fw-name">${esc(b.name)}</div>
  <div class="lib-fw-id"><code>${esc(b.id)}</code></div>
  <div class="lib-fw-stats">
    <span><strong>${b.framework_refs.length}</strong> framework(s)</span>
    ${b.requirement_refs.length > 0 ? `<span><strong>${b.requirement_refs.length}</strong> pinned requirements</span>` : `<span>Multi-framework core</span>`}
  </div>
</a>`;
    })
    .join("\n");

  const controlRows = controls
    .map((c) => {
      const yamlHref = `${repoBase}/blob/main/${c.yaml_path}`;
      const paramEntries = Object.entries(c.parameters || {});
      const paramsHtml =
        paramEntries.length > 0
          ? `<div class="lib-detail-section">
              <h4>Parameters (${paramEntries.length})</h4>
              <ul class="lib-parts">${paramEntries
                .map(
                  ([k, v]) =>
                    `<li><code>{{ ${esc(k)} }}</code> — ${esc(v.label || k)}${v.value ? ` (default: <em>${esc(v.value)}</em>)` : ""}</li>`,
                )
                .join("")}</ul>
            </div>`
          : "";

      const testsHtml =
        c.tests.length > 0
          ? `<div class="lib-detail-section">
              <h4>Library tests (${c.tests.length})</h4>
              <ul class="lib-parts">${c.tests
                .map(
                  (t) =>
                    `<li><code>${esc(t.method)}</code>${t.interval ? ` · <code>${esc(t.interval)}</code>` : ""}${t.required ? ` · <span class="lib-tag lib-tag--active">required</span>` : ""} — <strong>${esc(t.name)}</strong>${t.description ? `: ${esc(t.description)}` : ""}</li>`,
                )
                .join("")}</ul>
            </div>`
          : "";

      const mapsHtml =
        c.mappings.length > 0
          ? `<div class="lib-detail-section">
              <h4>Reviewed framework crosswalks (${c.mappings.length})</h4>
              <ul class="lib-parts">${c.mappings
                .map((m) => {
                  const pmap = m.parameter_map
                    ? ` <span class="lib-more-note">(maps ${Object.entries(m.parameter_map)
                        .map(([rk, ck]) => `${rk}←${ck}`)
                        .join(", ")})</span>`
                    : "";
                  return `<li><code>${esc(m.relationship)}</code> → <code>${esc(m.target_ref)}</code> <span class="lib-tag lib-tag--reviewed">${esc(m.review_status)}</span>${pmap}</li>`;
                })
                .join("")}</ul>
            </div>`
          : "";

      return `<details class="lib-item">
  <summary class="lib-item-summary">
    <span class="lib-item-id">${esc(c.display_id)}</span>
    <span class="lib-item-name">${esc(c.name)}</span>
    <span class="lib-item-badges">
      ${c.family ? `<span class="lib-tag">${esc(c.family)}</span>` : ""}
      ${c.control_type ? `<span class="lib-tag">${esc(c.control_type)}</span>` : ""}
      ${c.frequency ? `<span class="lib-tag">${esc(c.frequency)}</span>` : ""}
      <span class="lib-tag lib-tag--reviewed">${c.mappings.length} crosswalks</span>
    </span>
  </summary>
  <div class="lib-item-body">
    <div class="lib-item-meta">
      <code>${esc(c.id)}</code>
      <span>origin: standard</span>
      <span>${c.tests.length} test(s)</span>
      <a href="${esc(yamlHref)}" target="_blank" rel="noopener noreferrer">View YAML in ogrl-library ↗</a>
    </div>
    <div class="lib-detail-section">
      <h4>Control statement</h4>
      <p>${esc(c.statement)}</p>
    </div>
    <div class="lib-detail-section">
      <h4>Objective</h4>
      <p>${esc(c.objective)}</p>
    </div>
    ${c.guidance ? `<div class="lib-detail-section"><h4>Implementation guidance</h4><p>${esc(c.guidance)}</p></div>` : ""}
    ${paramsHtml}
    ${testsHtml}
    ${mapsHtml}
  </div>
</details>`;
    })
    .join("\n");

  const body = `<section class="hero-band">
  <div class="hero-inner">
    <p class="eyebrow">OGRL Standard Library · ${esc(bundle.id)}</p>
    <h1 class="hero-title">Open framework &amp; control catalog.</h1>
    <p class="hero-lede">
      Standard operational controls, starter baselines, library tests, reviewed multi-framework
      crosswalks, and normalized requirements with NIST assessment objectives. Authoritative YAML
      sources live in <a href="${esc(bundle.repo_url)}" target="_blank" rel="noopener noreferrer">ogrl-library</a>
      and are built and validated by <a href="${esc(bundle.tools_repo_url)}" target="_blank" rel="noopener noreferrer">ogrl-rs</a>.
    </p>
    <div class="lib-hero-actions">
      <a class="icon-btn" href="${esc(bundle.repo_url)}" target="_blank" rel="noopener noreferrer">Repository (ogrl-library) ↗</a>
      <a class="icon-btn" href="${esc(bundle.tools_repo_url)}" target="_blank" rel="noopener noreferrer">Toolchain (ogrl-rs) ↗</a>
      <a class="icon-btn" href="/library/catalog.json">Download catalog.json</a>
    </div>
    <div class="meta-bar">
      ${metaItems
        .map(
          (m) => `<div class="meta-item">
        <span class="meta-label">${esc(m.label)}</span>
        <span class="meta-value">${m.html}</span>
      </div>`,
        )
        .join("\n")}
    </div>
  </div>
</section>
<main class="index-main" data-library-catalog data-repo-url="${esc(bundle.repo_url)}">
  <h2 class="section-heading">Published Frameworks (${frameworks.length})</h2>
  <section class="lib-fw-grid" aria-label="Published frameworks">
    ${fwCards}
  </section>

  ${
    baselines.length > 0
      ? `<h2 class="section-heading section-heading--spaced">Starter Baselines (${baselines.length})</h2>
  <section class="lib-fw-grid" aria-label="Library baselines">
    ${baselineCards}
  </section>`
      : ""
  }

  ${
    controls.length > 0
      ? `<h2 class="section-heading section-heading--spaced">Standard Controls (${controls.length})</h2>
  <div class="lib-list lib-controls-list" aria-label="Standard OGRL controls">
    ${controlRows}
  </div>`
      : ""
  }

  <h2 class="section-heading section-heading--spaced">Requirement Explorer</h2>
  <section class="lib-controls" aria-label="Filter requirements">
    <input
      type="search"
      class="lib-search"
      data-lib-search
      placeholder="Search by ID, title, or prose (e.g. AC-2, CC6.1, A.8.5, 03.01.01, encryption)…"
      aria-label="Search requirements"
    />
    <div class="lib-filter-group" role="group" aria-label="Framework filter">
      <button type="button" class="lib-pill is-active" data-lib-fw-pill="all">All frameworks</button>
      ${frameworks
        .map(
          (fw) =>
            `<button type="button" class="lib-pill" data-lib-fw-pill="${esc(fw.slug)}">${esc(fw.slug)}</button>`,
        )
        .join("\n")}
    </div>
    <div class="lib-filter-group" role="group" aria-label="Status filter">
      <button type="button" class="lib-pill is-active" data-lib-status="all">All</button>
      <button type="button" class="lib-pill" data-lib-status="active">Active</button>
      <button type="button" class="lib-pill" data-lib-status="withdrawn">Withdrawn</button>
    </div>
  </section>

  <div class="lib-status-bar">
    <span data-lib-count>Loading ${counts.requirements.toLocaleString("en-US")} requirements…</span>
  </div>

  <div class="lib-list" data-lib-list></div>
  <div class="lib-more-wrap">
    <button type="button" class="icon-btn" data-lib-more hidden>Load more requirements</button>
  </div>
</main>`;

  return renderShell({
    title: "OGRL Standard Library Catalog — Open Governance Reference Language",
    description: `Browse ${counts.controls || 0} standard controls, ${counts.baselines || 0} baselines, ${counts.requirements} requirements, and ${counts.objectives} assessment objectives in the OGRL Standard Library.`,
    rfcs,
    currentSlug: null,
    activeNav: "library",
    body,
  });
}

export function renderRfcPage(rfc, rfcs, index) {
  const prev = index > 0 ? rfcs[index - 1] : null;
  const next = index < rfcs.length - 1 ? rfcs[index + 1] : null;

  const metaItems = [
    {
      label: "Status",
      html: `<span class="status-pill">${esc(rfc.meta.Status || "Draft")}</span>`,
    },
    {
      label: "Spec version",
      html: esc(rfc.meta["Spec version"] || "0.1.0"),
    },
    {
      label: "Date",
      html: esc(rfc.meta.Date || ""),
    },
    {
      label: "Reading time",
      html: `${rfc.readingMinutes} min`,
    },
  ];

  if (rfc.dependsOn.length > 0) {
    metaItems.push({
      label: "Depends on",
      html: rfc.dependsOn
        .map((d) => `<a href="/rfcs/${d.slug}/">${esc(d.label)}</a>`)
        .join(", "),
    });
  }

  const tocList = rfc.toc
    .map(
      (item) =>
        `<li class="toc-depth-${item.depth}"><a href="#${esc(item.id)}">${esc(item.text)}</a></li>`,
    )
    .join("\n");

  const pager =
    prev || next
      ? `<nav class="doc-pager" aria-label="Adjacent specifications">
  ${
    prev
      ? `<a class="pager-link" href="/rfcs/${prev.slug}/">
    <span class="pager-dir">← Previous</span>
    <span class="pager-title">RFC ${esc(prev.number)}: ${esc(prev.shortTitle)}</span>
  </a>`
      : ""
  }
  ${
    next
      ? `<a class="pager-link pager-link--next" href="/rfcs/${next.slug}/">
    <span class="pager-dir">Next →</span>
    <span class="pager-title">RFC ${esc(next.number)}: ${esc(next.shortTitle)}</span>
  </a>`
      : ""
  }
</nav>`
      : "";

  const body = `<section class="hero-band">
  <div class="doc-header-inner">
    <p class="eyebrow">RFC ${esc(rfc.number)}</p>
    <h1 class="doc-title">${esc(rfc.shortTitle)}</h1>
    <div class="meta-bar">
      ${metaItems
        .map(
          (m) => `<div class="meta-item">
        <span class="meta-label">${esc(m.label)}</span>
        <span class="meta-value">${m.html}</span>
      </div>`,
        )
        .join("\n")}
    </div>
  </div>
</section>
<div class="doc-shell">
  <main>
    <details class="mobile-toc">
      <summary>On this page</summary>
      <ul>${tocList}</ul>
    </details>
    <article class="prose">
      ${rfc.html}
      ${pager}
    </article>
  </main>
  <aside class="doc-toc" aria-label="Table of contents">
    <p class="toc-heading">On this page</p>
    <ul>
      ${tocList}
    </ul>
  </aside>
</div>`;

  return renderShell({
    title: `RFC ${rfc.number}: ${rfc.shortTitle} · OGRL`,
    description: rfc.summary,
    rfcs,
    currentSlug: rfc.slug,
    activeNav: rfc.slug,
    body,
  });
}

export function renderNotFoundPage(rfcs) {
  const body = `<section class="hero-band">
  <div class="hero-inner">
    <p class="eyebrow">404 · Not Found</p>
    <h1 class="hero-title">Specification not found.</h1>
    <p class="hero-lede">
      The requested RFC or path does not exist. Return to the <a href="/">RFC index</a> or browse
      the <a href="/library/">Standard Library catalog</a>.
    </p>
  </div>
</section>`;

  return renderShell({
    title: "404 · OGRL RFCs",
    description: "Page not found.",
    rfcs,
    currentSlug: null,
    activeNav: "none",
    body,
  });
}
