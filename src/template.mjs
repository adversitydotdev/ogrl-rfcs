function esc(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const HEXAGON_SVG = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`;

const THEME_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/></svg>`;

const THEME_INIT_SCRIPT = `<script>(function(){try{var s=localStorage.getItem("ogrl-rfcs-theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();</script>`;

function renderHeader(rfcs, currentSlug) {
  const navItems = rfcs
    .map(
      (r) =>
        `<a class="nav-link" href="/rfcs/${r.slug}/"${r.slug === currentSlug ? ' aria-current="page"' : ""}>${esc(r.number)}</a>`,
    )
    .join("");

  const rawBtn = currentSlug
    ? `<a class="icon-btn" href="/rfcs/${currentSlug}.md" title="Download raw Markdown">Raw .md</a>`
    : "";

  return `<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="/">
      <span class="brand-mark">${HEXAGON_SVG}</span>
      <span class="brand-wordmark">OGRL</span>
      <span class="brand-sep">/</span>
      <span class="brand-sub">RFCs</span>
    </a>
    <nav class="header-nav" aria-label="Specifications">
      <a class="nav-link" href="/"${!currentSlug ? ' aria-current="page"' : ""}>Index</a>
      ${navItems}
    </nav>
    <div class="header-actions">
      ${rawBtn}
      <button id="theme-toggle" class="icon-btn icon-btn--square" type="button" aria-label="Toggle color theme">${THEME_SVG}</button>
    </div>
  </div>
</header>`;
}

function renderShell({ title, description, rfcs, currentSlug, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Geist:wght@400;500;600&family=Spectral:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet" />
  ${THEME_INIT_SCRIPT}
  <link rel="stylesheet" href="/assets/styles.css" />
</head>
<body>
  ${renderHeader(rfcs, currentSlug)}
  ${body}
  <footer class="site-footer">
    <div class="footer-inner">
      <span>OGRL · Open GRC Language · Spec 0.1.0</span>
      <span><a href="/">All RFCs</a></span>
    </div>
  </footer>
  <script src="/assets/client.js" defer></script>
</body>
</html>`;
}

export function renderIndexPage(rfcs) {
  const layers = [
    {
      num: "0001",
      slug: "0001-object-model",
      name: "Object Model",
      role: "Typed graph, YAML/JSON forms, constraints, computed status.",
    },
    {
      num: "0002",
      slug: "0002-tooling",
      name: "Tooling & Authority",
      role: "Library pulls, provider bundles, Git snapshots, OSCAL export.",
    },
    {
      num: "0003",
      slug: "0003-application",
      name: "Application",
      role: "Pure kernel, agent write gates, ports, Postgres, AWS topology.",
    },
    {
      num: "0004",
      slug: "0004-http-api",
      name: "HTTP API",
      role: "Native object routes, If-Match concurrency, async jobs, errors.",
    },
  ];

  const layerStrip = `<section class="layer-strip" aria-label="Specification architecture">
  ${layers
    .map(
      (l) => `<a class="layer-card" href="/rfcs/${l.slug}/">
    <div class="layer-step">RFC ${l.num}</div>
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

  const body = `<section class="hero-band">
  <div class="hero-inner">
    <p class="eyebrow">Open GRC Language · Request for Comments</p>
    <h1 class="hero-title">Specifications for an open security program.</h1>
    <p class="hero-lede">
      OGRL defines a portable, graph-based language for security controls, framework crosswalks,
      implementations, tests, and evidence—along with the architecture for running a self-hosted
      program that never traps its data inside a vendor's private model.
    </p>
  </div>
</section>
<main class="index-main">
  ${layerStrip}
  <h2 class="section-heading">Specifications (${rfcs.length})</h2>
  <section class="rfc-list" aria-label="RFC list">
    ${rows}
  </section>
</main>`;

  return renderShell({
    title: "OGRL RFCs — Open GRC Language Specifications",
    description:
      "Request for Comments specifications for OGRL (Open GRC Language): object model, tooling, application architecture, and HTTP API.",
    rfcs,
    currentSlug: null,
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
    body,
  });
}
