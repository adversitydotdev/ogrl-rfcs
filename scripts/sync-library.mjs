import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WORKSPACE = path.resolve(ROOT, "..");

const LIBRARY_DIR =
  process.env.OGRL_LIBRARY_DIR || path.join(WORKSPACE, "ogrl-library", "library");
const OGRL_BIN =
  process.env.OGRL_BIN || path.join(WORKSPACE, "ogrl-rs", "target", "release", "ogrl");
const REPO_URL =
  process.env.OGRL_LIBRARY_REPO_URL || "https://github.com/adversitydotdev/ogrl-library";
const TOOLS_REPO_URL =
  process.env.OGRL_TOOLS_REPO_URL || "https://github.com/adversitydotdev/ogrl-rs";
const OUT_FILE = path.join(ROOT, "data", "library-catalog.json");

function getGitCommit(dir) {
  try {
    return execFileSync("git", ["-C", dir, "rev-parse", "--short", "HEAD"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

export function syncLibrary() {
  if (!fs.existsSync(LIBRARY_DIR)) {
    throw new Error(`Library directory not found: ${LIBRARY_DIR}`);
  }
  if (!fs.existsSync(OGRL_BIN)) {
    throw new Error(`ogrl binary not found: ${OGRL_BIN} (build ogrl-rs with cargo build --release)`);
  }

  const tmpFile = path.join(os.tmpdir(), `ogrl-site-pack-${process.pid}.json`);
  try {
    execFileSync(OGRL_BIN, ["bundle", "pack", LIBRARY_DIR, "--out", tmpFile], {
      stdio: ["ignore", "pipe", "inherit"],
    });
    const digest = execFileSync(OGRL_BIN, ["bundle", "digest", LIBRARY_DIR], {
      encoding: "utf-8",
    }).trim();
    const packed = JSON.parse(fs.readFileSync(tmpFile, "utf-8"));
    const objects = packed.objects || [];

    const frameworksById = new Map();
    const mappingsBySource = new Map();
    const requirements = [];
    let totalMappings = 0;

    for (const obj of objects) {
      if (obj.type === "framework") {
        const slug = obj.id.replace(/^framework--/, "");
        frameworksById.set(obj.id, {
          id: obj.id,
          slug,
          name: obj.name,
          publisher: obj.publisher,
          version: obj.version,
          reproduction: obj.reproduction,
          source: obj.source || null,
          requirement_count: 0,
          active_count: 0,
          withdrawn_count: 0,
          objective_count: 0,
          mapping_count: 0,
        });
      } else if (obj.type === "mapping") {
        totalMappings += 1;
        const list = mappingsBySource.get(obj.source_ref) || [];
        list.push({
          id: obj.id,
          target_ref: obj.target_ref,
          relationship: obj.relationship,
          review_status: obj.review_status || "draft",
        });
        mappingsBySource.set(obj.source_ref, list);
      }
    }

    let totalObjectives = 0;
    let withdrawnCount = 0;

    for (const obj of objects) {
      if (obj.type !== "requirement") continue;
      const fw = frameworksById.get(obj.framework_ref);
      const fwSlug = obj.framework_ref.replace(/^framework--/, "");
      const localSlug = obj.id.replace(`requirement--${fwSlug}-`, "");
      const objCount = Array.isArray(obj.objectives) ? obj.objectives.length : 0;
      const parts = Array.isArray(obj.parts)
        ? obj.parts.map((p) => ({ id: p.id, statement: p.statement }))
        : [];
      const paramsCount = obj.parameters ? Object.keys(obj.parameters).length : 0;
      const mappings = mappingsBySource.get(obj.id) || [];
      const withdrawn = Boolean(obj.withdrawn);

      totalObjectives += objCount;
      if (withdrawn) withdrawnCount += 1;

      if (fw) {
        fw.requirement_count += 1;
        if (withdrawn) fw.withdrawn_count += 1;
        else fw.active_count += 1;
        fw.objective_count += objCount;
        fw.mapping_count += mappings.length;
      }

      requirements.push({
        id: obj.id,
        slug: localSlug,
        display_id: obj.display_id || localSlug,
        name: obj.name,
        framework_id: obj.framework_ref,
        framework_slug: fwSlug,
        class: obj.class,
        withdrawn,
        statement: obj.statement || null,
        parts,
        objectives_count: objCount,
        objectives_preview: Array.isArray(obj.objectives)
          ? obj.objectives.slice(0, 6).map((o) => ({ id: o.id, statement: o.statement }))
          : [],
        params_count: paramsCount,
        mappings,
        yaml_path: `library/requirement/${fwSlug}/${localSlug}.yaml`,
      });
    }

    requirements.sort((a, b) =>
      a.framework_slug === b.framework_slug
        ? a.display_id.localeCompare(b.display_id, undefined, { numeric: true })
        : a.framework_slug.localeCompare(b.framework_slug),
    );

    const frameworks = Array.from(frameworksById.values()).sort((a, b) =>
      a.slug.localeCompare(b.slug),
    );

    const catalog = {
      bundle: {
        id: packed.id,
        name: packed.name || "OGRL Control Library",
        version: packed.version || "0.1.0",
        spec_version: packed.spec_version || "0.1.0",
        modified: packed.modified || null,
        digest,
        commit: getGitCommit(path.dirname(LIBRARY_DIR)),
        repo_url: REPO_URL,
        tools_repo_url: TOOLS_REPO_URL,
      },
      counts: {
        objects: objects.length,
        frameworks: frameworks.length,
        requirements: requirements.length,
        active_requirements: requirements.length - withdrawnCount,
        withdrawn_requirements: withdrawnCount,
        objectives: totalObjectives,
        mappings: totalMappings,
      },
      frameworks,
      requirements,
    };

    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, JSON.stringify(catalog), "utf-8");
    const kb = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
    console.log(
      `Synced library catalog (${requirements.length} requirements, ${totalObjectives} objectives, ${totalMappings} mappings) -> ${path.relative(ROOT, OUT_FILE)} (${kb} KB)`,
    );
    return catalog;
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncLibrary();
}
