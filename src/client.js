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
})();
