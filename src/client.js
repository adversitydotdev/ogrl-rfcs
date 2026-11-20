(function () {
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");

  function setTheme(dark) {
    root.classList.toggle("dark", dark);
    if (toggle) {
      toggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      toggle.dataset.theme = dark ? "dark" : "light";
    }
  }

  if (toggle) {
    setTheme(root.classList.contains("dark"));
    toggle.addEventListener("click", () => {
      const next = !root.classList.contains("dark");
      localStorage.setItem("ogrl-rfcs-theme", next ? "dark" : "light");
      setTheme(next);
    });
  }

  // Copy buttons on code blocks
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const pre = btn.closest(".code-block")?.querySelector("pre");
      if (!pre) return;
      try {
        await navigator.clipboard.writeText(pre.textContent || "");
        const prev = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(() => {
          btn.textContent = prev;
        }, 1500);
      } catch {
        btn.textContent = "Failed";
      }
    });
  });

  // Active section highlight in sticky TOC
  const tocLinks = Array.from(document.querySelectorAll(".doc-toc a[href^='#']"));
  if (tocLinks.length > 0) {
    const targets = tocLinks
      .map((a) => ({ a, el: document.getElementById(a.getAttribute("href").slice(1)) }))
      .filter((item) => item.el);

    function updateActive() {
      const offset = 110;
      let current = targets[0];
      for (const item of targets) {
        if (item.el.getBoundingClientRect().top <= offset) {
          current = item;
        } else {
          break;
        }
      }
      tocLinks.forEach((a) => a.classList.toggle("is-active", current && a === current.a));
    }

    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => {
            updateActive();
            ticking = false;
          });
        }
      },
      { passive: true },
    );
    updateActive();
  }

  // Interactive Section 8 Control Status Explorer
  document.querySelectorAll("[data-status-explorer]").forEach((box) => {
    const get = (name) => box.querySelector(`[data-se="${name}"]`)?.value;
    const badge = box.querySelector("[data-se-badge]");
    const reasonEl = box.querySelector("[data-se-reason]");

    function evaluate() {
      const origin = get("origin");
      const status = get("status");
      const resp = get("responsibility");
      const params = get("params");
      const test = get("test");
      const ev = get("evidence");
      const exc = get("exception");

      let state = "gap";
      let cls = "gap";
      let reason = "";

      // Check waived / out-of-scope / met per RFC 0001 Section 8
      if (status === "not-applicable") {
        state = "out-of-scope";
        cls = "oos";
        reason = "Implementation status is not-applicable (reason documented in narrative).";
      } else if (origin === "organization" && (resp === "customer" || resp === "subservice")) {
        state = "out-of-scope";
        cls = "oos";
        reason = `Organization-authored row with responsibility "${resp}" delegates the practice outside the organization's own test scope.`;
      } else if (status === "exception") {
        if (exc === "active") {
          state = "waived";
          cls = "waived";
          reason = "Implementation status is exception and an active, unexpired exception object points to it.";
        } else {
          state = "gap";
          cls = "gap";
          reason = "Implementation status is exception, but no unexpired exception object references it.";
        }
      } else if (status !== "implemented") {
        state = "gap";
        cls = "gap";
        reason = `Implementation status is "${status}" (must be "implemented" to satisfy condition 1).`;
      } else if (origin === "provider" && (resp === "shared" || resp === "customer")) {
        state = "gap";
        cls = "gap";
        reason =
          resp === "shared"
            ? 'Provider-authored "shared" row covers only the provider\'s half; control stays in gap until the organization authors its own implementation for customer_responsibility.'
            : 'Provider-authored "customer" row states the customer must implement the control; the provider row alone never satisfies it.';
      } else if (params === "unset") {
        state = "gap";
        cls = "gap";
        reason = "One or more parameters in the control statement remain unset after implementation → baseline → control resolution.";
      } else if (test === "none") {
        if (ev === "valid") {
          state = "met";
          cls = "met";
          reason = "No required test applies, and at least one complete, unexpired evidence record is attached to the implementation.";
        } else {
          state = "gap";
          cls = "gap";
          reason = `No required test applies, so Section 8 requires at least one complete, unexpired evidence record on the implementation (current evidence: ${ev}).`;
        }
      } else if (origin === "provider" && (resp === "provider" || resp === "subservice") && test === "no-methodology") {
        if (ev === "valid") {
          state = "met";
          cls = "met";
          reason = "Provider exception applies: complete, unexpired evidence on the provider implementation (e.g. vendor audit report) satisfies unfulfilled library tests.";
        } else {
          state = "gap";
          cls = "gap";
          reason = `Provider implementation lacks complete, unexpired evidence to satisfy the unfulfilled library test (current evidence: ${ev}).`;
        }
      } else if (test === "no-methodology") {
        state = "gap";
        cls = "gap";
        reason = "Required automated test has neither a run block nor an applicable fulfilling organization test (no methodology defined).";
      } else if (test === "pass-stale") {
        state = "gap";
        cls = "gap";
        reason = "Latest passing result falls outside the test interval's freshness window at the evaluation instant.";
      } else if (test === "fail") {
        state = "gap";
        cls = "gap";
        reason = "Current result outcome is fail, error, or skip (earlier passes no longer count once a newer result exists).";
      } else if (ev !== "valid") {
        state = "gap";
        cls = "gap";
        reason = `Evidence cited by the passing result is ${ev === "expired" ? "expired (valid_until precedes the evaluation date)" : ev === "incomplete" ? "incomplete (missing required SHA-256 digest)" : "missing"}.`;
      } else {
        state = "met";
        cls = "met";
        reason = "All six Section 8 conditions hold: implemented, eligible responsibility, parameters resolved, required test passing within freshness window, and complete unexpired evidence.";
      }

      if (badge) {
        badge.textContent = state;
        badge.className = `se-badge se-badge--${cls}`;
      }
      if (reasonEl) {
        reasonEl.textContent = reason;
      }
    }

    box.querySelectorAll("select").forEach((sel) => sel.addEventListener("change", evaluate));
    evaluate();
  });

  // Interactive Standard Library Catalog Browser (/library/)
  const catalogRoot = document.querySelector("[data-library-catalog]");
  if (catalogRoot) {
    const searchEl = catalogRoot.querySelector("[data-lib-search]");
    const listEl = catalogRoot.querySelector("[data-lib-list]");
    const countEl = catalogRoot.querySelector("[data-lib-count]");
    const moreBtn = catalogRoot.querySelector("[data-lib-more]");
    const repoUrl = catalogRoot.dataset.repoUrl || "https://github.com/adversitydotdev/ogrl-library";

    let allReqs = [];
    let filtered = [];
    let activeFw = "all";
    let activeStatus = "all";
    let query = "";
    let visibleLimit = 60;

    function esc(str) {
      return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }

    function renderRow(req) {
      const yamlHref = `${repoUrl.replace(/\/$/, "")}/blob/main/${req.yaml_path}`;
      const badges = [
        `<span class="lib-tag">${esc(req.framework_slug)}</span>`,
        `<span class="lib-tag">${esc(req.class)}</span>`,
        req.withdrawn
          ? `<span class="lib-tag lib-tag--withdrawn">withdrawn</span>`
          : `<span class="lib-tag lib-tag--active">active</span>`,
      ];
      if (req.objectives_count > 0) {
        badges.push(`<span class="lib-tag">${req.objectives_count} obj</span>`);
      }
      if (req.mappings.length > 0) {
        badges.push(`<span class="lib-tag">${req.mappings.length} map</span>`);
      }

      const partsHtml =
        req.parts.length > 0
          ? `<div class="lib-detail-section">
              <h4>Statement parts (${req.parts.length})</h4>
              <ul class="lib-parts">${req.parts
                .map(
                  (p) =>
                    `<li><code>${esc(p.id)}</code> ${esc(p.statement)}</li>`,
                )
                .join("")}</ul>
            </div>`
          : "";

      const stmtHtml = req.statement
        ? `<div class="lib-detail-section"><h4>Statement</h4><p>${esc(req.statement)}</p></div>`
        : "";

      const objsHtml =
        req.objectives_preview && req.objectives_preview.length > 0
          ? `<div class="lib-detail-section">
              <h4>Assessment objectives (${req.objectives_count})</h4>
              <ul class="lib-parts">${req.objectives_preview
                .map((o) => `<li><code>#obj.${esc(o.id)}</code> ${esc(o.statement)}</li>`)
                .join("")}${
                req.objectives_count > req.objectives_preview.length
                  ? `<li class="lib-more-note">…and ${req.objectives_count - req.objectives_preview.length} more in YAML</li>`
                  : ""
              }</ul>
            </div>`
          : "";

      const mapsHtml =
        req.mappings.length > 0
          ? `<div class="lib-detail-section">
              <h4>Outgoing mappings (${req.mappings.length})</h4>
              <ul class="lib-parts">${req.mappings
                .map(
                  (m) =>
                    `<li><code>${esc(m.relationship)}</code> → <code>${esc(m.target_ref)}</code> <span class="lib-tag">${esc(m.review_status)}</span></li>`,
                )
                .join("")}</ul>
            </div>`
          : "";

      return `<details class="lib-item">
  <summary class="lib-item-summary">
    <span class="lib-item-id">${esc(req.display_id)}</span>
    <span class="lib-item-name">${esc(req.name)}</span>
    <span class="lib-item-badges">${badges.join("")}</span>
  </summary>
  <div class="lib-item-body">
    <div class="lib-item-meta">
      <code>${esc(req.id)}</code>
      <span>${req.params_count} parameter(s)</span>
      <a href="${esc(yamlHref)}" target="_blank" rel="noopener noreferrer">View YAML in ogrl-library ↗</a>
    </div>
    ${stmtHtml}
    ${partsHtml}
    ${objsHtml}
    ${mapsHtml}
  </div>
</details>`;
    }

    function render() {
      const slice = filtered.slice(0, visibleLimit);
      listEl.innerHTML =
        slice.length > 0
          ? slice.map(renderRow).join("\n")
          : `<p class="lib-empty">No requirements match the current filters.</p>`;
      countEl.textContent = `Showing ${slice.length.toLocaleString("en-US")} of ${filtered.length.toLocaleString("en-US")} matching requirements (${allReqs.length.toLocaleString("en-US")} total)`;
      if (moreBtn) {
        moreBtn.hidden = slice.length >= filtered.length;
      }
    }

    function applyFilters() {
      const q = query.trim().toLowerCase();
      filtered = allReqs.filter((r) => {
        if (activeFw !== "all" && r.framework_slug !== activeFw) return false;
        if (activeStatus === "active" && r.withdrawn) return false;
        if (activeStatus === "withdrawn" && !r.withdrawn) return false;
        if (!q) return true;
        return r._haystack.includes(q);
      });
      visibleLimit = 60;
      render();
    }

    function setActiveFramework(slug) {
      activeFw = slug;
      catalogRoot.querySelectorAll("[data-lib-fw-pill]").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.libFwPill === slug);
      });
      catalogRoot.querySelectorAll("[data-lib-fw]").forEach((card) => {
        card.classList.toggle("is-active", card.dataset.libFw === slug);
      });
      applyFilters();
    }

    catalogRoot.querySelectorAll("[data-lib-fw-pill]").forEach((btn) => {
      btn.addEventListener("click", () => setActiveFramework(btn.dataset.libFwPill));
    });
    catalogRoot.querySelectorAll("[data-lib-fw]").forEach((card) => {
      card.addEventListener("click", () => {
        const slug = card.dataset.libFw;
        setActiveFramework(activeFw === slug ? "all" : slug);
      });
    });
    catalogRoot.querySelectorAll("[data-lib-status]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeStatus = btn.dataset.libStatus;
        catalogRoot.querySelectorAll("[data-lib-status]").forEach((b) => {
          b.classList.toggle("is-active", b === btn);
        });
        applyFilters();
      });
    });
    if (searchEl) {
      searchEl.addEventListener("input", () => {
        query = searchEl.value;
        applyFilters();
      });
    }
    if (moreBtn) {
      moreBtn.addEventListener("click", () => {
        visibleLimit += 80;
        render();
      });
    }

    fetch("/library/catalog.json")
      .then((res) => res.json())
      .then((data) => {
        allReqs = (data.requirements || []).map((r) => ({
          ...r,
          _haystack: [
            r.display_id,
            r.id,
            r.name,
            r.statement || "",
            ...(r.parts || []).map((p) => p.statement),
          ]
            .join(" ")
            .toLowerCase(),
        }));
        applyFilters();
      })
      .catch(() => {
        countEl.textContent = "Failed to load /library/catalog.json.";
      });
  }
})();
