import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";
import { renderFigure } from "../src/diagrams.mjs";
import {
  renderIndexPage,
  renderLibraryPage,
  renderNotFoundPage,
  renderRfcPage,
} from "../src/template.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RFCS_DIR = path.join(ROOT, "rfcs");
const DATA_DIR = path.join(ROOT, "data");
const SRC_DIR = path.join(ROOT, "src");
const DIST_DIR = path.join(ROOT, "dist");

function escHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(text) {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/`/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function highlightYaml(code) {
  return code
    .split("\n")
    .map((line) => {
      if (/^\s*#/.test(line)) {
        return `<span class="tok-comment">${escHtml(line)}</span>`;
      }
      // Split trailing comment not inside quotes
      let main = line;
      let comment = "";
      const commentMatch = line.match(/^([^"']*?)(\s+#.*)$/);
      if (commentMatch) {
        main = commentMatch[1];
        comment = `<span class="tok-comment">${escHtml(commentMatch[2])}</span>`;
      }
      const kv = main.match(/^(\s*(?:-\s+)?)([A-Za-z0-9_.-]+)(:)(\s*)(.*)$/);
      if (kv) {
        const [, indent, key, colon, space, val] = kv;
        let renderedVal = escHtml(val);
        if (/^".*"$|^'.*'$/.test(val)) {
          renderedVal = `<span class="tok-str">${escHtml(val)}</span>`;
        } else if (/^(true|false|\d+(?:\.\d+)?)$/.test(val)) {
          renderedVal = `<span class="tok-num">${escHtml(val)}</span>`;
        }
        return `${escHtml(indent)}<span class="tok-key">${escHtml(key)}</span>${colon}${space}${renderedVal}${comment}`;
      }
      return `${escHtml(main)}${comment}`;
    })
    .join("\n");
}

function stripTitleAndMeta(markdown) {
  const lines = markdown.split("\n");
  let i = 0;

  // Title line: # RFC 0001: ...
  let fullTitle = "";
  if (lines[i]?.startsWith("# ")) {
    fullTitle = lines[i].slice(2).trim();
    i++;
  }
  while (i < lines.length && lines[i].trim() === "") i++;

  // Metadata table immediately following the H1
  const meta = {};
  if (lines[i]?.startsWith("|") && lines[i + 1]?.startsWith("|---")) {
    i += 2;
    while (i < lines.length && lines[i].startsWith("|")) {
      const cells = lines[i]
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      if (cells.length >= 2 && cells[0]) {
        meta[cells[0]] = cells[1];
      }
      i++;
    }
  }
  while (i < lines.length && lines[i].trim() === "") i++;

  const bodyMarkdown = lines.slice(i).join("\n");
  return { fullTitle, meta, bodyMarkdown };
}

function extractSummary(bodyMarkdown) {
  const paragraphs = bodyMarkdown
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith("#") && !p.startsWith("|") && !p.startsWith("```"));
  if (!paragraphs.length) return "";
  return paragraphs[0]
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDependsOn(raw) {
  if (!raw) return [];
  const results = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const label = m[1].trim();
    const target = m[2].trim().replace(/\.md$/, "");
    results.push({ label, slug: target });
  }
  return results;
}

function rewriteHref(href) {
  if (!href) return href;
  const rfcLink = href.match(/^(?:\.\/)?(\d{4}-[a-z0-9-]+)\.md(#.*)?$/);
  if (rfcLink) {
    return `/rfcs/${rfcLink[1]}/${rfcLink[2] || ""}`;
  }
  return href;
}

export function build() {
  const files = fs
    .readdirSync(RFCS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const rfcs = [];
  const headingIdsBySlug = new Map();
  const outboundLinks = [];

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(RFCS_DIR, file), "utf-8");
    const { fullTitle, meta, bodyMarkdown } = stripTitleAndMeta(raw);

    const numMatch = fullTitle.match(/^RFC\s+(\d+):\s*(.+)$/);
    const number = numMatch ? numMatch[1] : slug.slice(0, 4);
    const shortTitle = numMatch ? numMatch[2].trim() : fullTitle;
    const summary = extractSummary(bodyMarkdown);
    const words = bodyMarkdown.split(/\s+/).filter(Boolean).length;
    const readingMinutes = Math.max(1, Math.round(words / 230));
    const dependsOn = parseDependsOn(meta["Depends on"]);

    const toc = [];
    const seenIds = new Set();

    const marked = new Marked({ gfm: true, breaks: false });
    marked.use({
      renderer: {
        heading({ tokens, depth }) {
          const inner = this.parser.parseInline(tokens);
          const plain = inner.replace(/<[^>]+>/g, "");
          let id = slugify(plain);
          let n = 2;
          while (seenIds.has(id)) {
            id = `${slugify(plain)}-${n++}`;
          }
          seenIds.add(id);
          if (depth === 2 || depth === 3) {
            toc.push({ depth, id, text: plain });
          }
          return `<h${depth} id="${id}"><a class="heading-anchor" href="#${id}" aria-label="Link to ${escHtml(plain)}">#</a>${inner}</h${depth}>\n`;
        },
        code({ text, lang }) {
          const language = (lang || "text").trim().toLowerCase();
          if (language === "mermaid") {
            return `<figure class="rfc-figure"><div class="rfc-figure-body"><pre class="mermaid">${escHtml(text)}</pre></div></figure>\n`;
          }
          const highlighted =
            language === "yaml" || language === "yml" ? highlightYaml(text) : escHtml(text);
          return `<div class="code-block">
  <div class="code-block-head">
    <span class="code-lang">${escHtml(language)}</span>
    <button class="copy-btn" type="button">Copy</button>
  </div>
  <pre><code>${highlighted}</code></pre>
</div>\n`;
        },
        table(token) {
          const headerCells = token.header
            .map((cell) => `<th>${this.parser.parseInline(cell.tokens)}</th>`)
            .join("");
          const riskBands = new Set(["low", "medium", "high", "critical"]);
          const isRiskMatrix =
            token.header.length === 6 &&
            token.rows.length === 5 &&
            token.rows.every((r) =>
              r.slice(1).every((c) => riskBands.has(c.text.trim().toLowerCase())),
            );
          const rows = token.rows
            .map(
              (row) =>
                `<tr>${row
                  .map((cell, idx) => {
                    const inner = this.parser.parseInline(cell.tokens);
                    if (isRiskMatrix && idx > 0) {
                      const band = cell.text.trim().toLowerCase();
                      return `<td class="risk-cell risk-cell--${band}">${inner}</td>`;
                    }
                    return `<td>${inner}</td>`;
                  })
                  .join("")}</tr>`,
            )
            .join("\n");
          const cls = isRiskMatrix ? "table-wrap table-wrap--risk" : "table-wrap";
          return `<div class="${cls}"><table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
        },
        link({ href, title, tokens }) {
          const rewritten = rewriteHref(href);
          outboundLinks.push({ from: slug, href: rewritten });
          const text = this.parser.parseInline(tokens);
          const titleAttr = title ? ` title="${escHtml(title)}"` : "";
          const external = /^https?:\/\//.test(rewritten)
            ? ' target="_blank" rel="noopener noreferrer"'
            : "";
          return `<a href="${escHtml(rewritten)}"${titleAttr}${external}>${text}</a>`;
        },
      },
    });

    const rawHtml = marked.parse(bodyMarkdown);
    const html = rawHtml.replace(/<!--\s*figure:\s*([a-z0-9-]+)\s*-->/g, (_, id) => renderFigure(id));
    headingIdsBySlug.set(slug, seenIds);

    rfcs.push({
      file,
      slug,
      number,
      fullTitle,
      shortTitle,
      summary,
      meta,
      dependsOn,
      readingMinutes,
      toc,
      html,
      raw,
    });
  }

  // Validate all internal and cross-RFC anchors
  const broken = [];
  for (const { from, href } of outboundLinks) {
    if (href.startsWith("#")) {
      const anchor = href.slice(1);
      if (!headingIdsBySlug.get(from)?.has(anchor)) {
        broken.push(`${from}: broken local anchor ${href}`);
      }
    } else if (href.startsWith("/rfcs/")) {
      const m = href.match(/^\/rfcs\/([^/]+)\/(?:#(.+))?$/);
      if (!m) continue;
      const [, targetSlug, anchor] = m;
      const targetIds = headingIdsBySlug.get(targetSlug);
      if (!targetIds) {
        broken.push(`${from}: unknown RFC target ${href}`);
      } else if (anchor && !targetIds.has(anchor)) {
        broken.push(`${from}: broken cross-RFC anchor ${href}`);
      }
    }
  }
  if (broken.length > 0) {
    throw new Error(`Broken RFC links detected:\n  - ${broken.join("\n  - ")}`);
  }

  // Load synced standard library catalog snapshot if available
  const catalogPath = path.join(DATA_DIR, "library-catalog.json");
  const catalog = fs.existsSync(catalogPath)
    ? JSON.parse(fs.readFileSync(catalogPath, "utf-8"))
    : null;

  // Write output cleanly
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST_DIR, "assets"), { recursive: true });
  fs.mkdirSync(path.join(DIST_DIR, "rfcs"), { recursive: true });

  fs.copyFileSync(path.join(SRC_DIR, "styles.css"), path.join(DIST_DIR, "assets", "styles.css"));
  fs.copyFileSync(path.join(SRC_DIR, "client.js"), path.join(DIST_DIR, "assets", "client.js"));

  fs.writeFileSync(path.join(DIST_DIR, "index.html"), renderIndexPage(rfcs, catalog), "utf-8");
  fs.writeFileSync(path.join(DIST_DIR, "404.html"), renderNotFoundPage(rfcs), "utf-8");

  if (catalog) {
    const libDist = path.join(DIST_DIR, "library");
    fs.mkdirSync(libDist, { recursive: true });
    fs.writeFileSync(
      path.join(libDist, "index.html"),
      renderLibraryPage(rfcs, catalog),
      "utf-8",
    );
    fs.copyFileSync(catalogPath, path.join(libDist, "catalog.json"));
  }

  rfcs.forEach((rfc, index) => {
    const dir = path.join(DIST_DIR, "rfcs", rfc.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), renderRfcPage(rfc, rfcs, index), "utf-8");
    fs.writeFileSync(path.join(DIST_DIR, "rfcs", `${rfc.slug}.md`), rfc.raw, "utf-8");
  });

  const libMsg = catalog ? ` + library catalog (${catalog.counts.requirements} requirements)` : "";
  console.log(`Built ${rfcs.length} RFCs${libMsg} into ${path.relative(ROOT, DIST_DIR)}/`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build();
}
