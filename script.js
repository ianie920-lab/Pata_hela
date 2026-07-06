/* ============ CONFIG ============ */
// Paste a webhook URL that sends proper CORS headers (e.g. a Pipedream HTTP
// trigger, a Cloudflare Worker, or your own small server). Unlike Google Apps
// Script, this lets us use a normal fetch and actually detect success/failure
// instead of guessing. See the setup guide for options.
const NOTIFY_WEBHOOK_URL = "https://eob6h03w99t40gt.m.pipedream.net";

/* ============ UTIL ============ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

document.addEventListener("DOMContentLoaded", () => {
  $("#year").textContent = new Date().getFullYear();

  /* ---------- SPLASH ---------- */
  setTimeout(() => {
    const splash = $("#splash");
    if (splash) splash.style.display = "none";
  }, 4000);

  /* ---------- VIEW NAVIGATION (smooth transition, no harsh cuts) ---------- */
  $$("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.getAttribute("data-nav")));
  });

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showView(id) {
    const target = document.getElementById(id);
    const current = $(".view.active");
    if (!target || target === current) return;

    if (!current || prefersReducedMotion) {
      $$(".view").forEach((v) => v.classList.remove("active", "view-entering", "view-leaving"));
      activate();
      return;
    }

    current.classList.add("view-leaving");
    setTimeout(() => {
      current.classList.remove("active", "view-leaving");
      activate();
    }, 220);

    function activate() {
      target.classList.add("active", "view-entering");
      window.scrollTo({ top: 0, behavior: "auto" });
      // force layout so the browser registers the "entering" state before we remove it
      void target.offsetWidth;
      requestAnimationFrame(() => target.classList.remove("view-entering"));
      syncTabbar(id);
    }
  }
  window.showView = showView;

  /* ---------- BOTTOM TAB BAR ---------- */
  const tabBtns = $$(".tab-btn");
  const tabIndicator = $("#tabIndicator");

  function moveIndicatorTo(btn) {
    if (!btn || !tabIndicator) return;
    tabIndicator.style.width = btn.offsetWidth + "px";
    tabIndicator.style.transform = `translateX(${btn.offsetLeft}px)`;
  }

  function syncTabbar(viewId) {
    const map = { "view-landing": "home", "view-form": "apply", "view-learn": "about" };
    const activeTab = map[viewId];
    if (!activeTab) return;
    tabBtns.forEach((b) => b.classList.toggle("active", b.getAttribute("data-tab") === activeTab));
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${activeTab}"]`);
    moveIndicatorTo(activeBtn);
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const scrollTarget = btn.getAttribute("data-scroll");
      if (scrollTarget) {
        tabBtns.forEach((b) => b.classList.toggle("active", b === btn));
        moveIndicatorTo(btn);
        showView("view-landing");
        setTimeout(() => {
          document.getElementById(scrollTarget)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 260);
      }
    });
  });

  // position the indicator correctly after fonts/layout settle, and on resize
  window.addEventListener("load", () => moveIndicatorTo(document.querySelector(".tab-btn.active")));
  window.addEventListener("resize", () => moveIndicatorTo(document.querySelector(".tab-btn.active")));
  setTimeout(() => moveIndicatorTo(document.querySelector(".tab-btn.active")), 50);

  /* ---------- CURSOR PARALLAX TILT (hero card stack, fine pointers only) ---------- */
  const cardStack = $("#cardStack");
  const cardStackInner = $("#cardStackInner");
  const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (cardStack && cardStackInner && supportsFinePointer && !prefersReducedMotion) {
    cardStack.addEventListener("pointermove", (e) => {
      const rect = cardStack.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const maxTilt = 8;
      cardStackInner.style.transform = `rotateX(${(-y * maxTilt).toFixed(2)}deg) rotateY(${(x * maxTilt).toFixed(2)}deg)`;
    });
    cardStack.addEventListener("pointerleave", () => {
      cardStackInner.style.transform = "rotateX(0deg) rotateY(0deg)";
    });
  }

  /* ---------- CARD FLIP (hero) ---------- */
  const flipBtn = $("#flipBtn");
  const flipInner = $("#flipInner");
  if (flipBtn && flipInner) {
    flipBtn.addEventListener("click", () => {
      const flipped = flipInner.classList.toggle("flipped");
      flipBtn.classList.toggle("is-flipped", flipped);
    });
  }

  /* ---------- FEATURE CAROUSEL DOTS (mobile) ---------- */
  const featureCarousel = $("#featureCarousel");
  const featureDots = $("#featureDots");
  if (featureCarousel && featureDots) {
    const cards = Array.from(featureCarousel.children);
    cards.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "dot" + (i === 0 ? " active" : "");
      featureDots.appendChild(dot);
    });
    const dots = Array.from(featureDots.children);
    let dotTicking = false;
    featureCarousel.addEventListener("scroll", () => {
      if (dotTicking) return;
      dotTicking = true;
      requestAnimationFrame(() => {
        const center = featureCarousel.scrollLeft + featureCarousel.clientWidth / 2;
        let closest = 0;
        let closestDist = Infinity;
        cards.forEach((card, i) => {
          const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
          if (dist < closestDist) { closestDist = dist; closest = i; }
        });
        dots.forEach((d, i) => d.classList.toggle("active", i === closest));
        dotTicking = false;
      });
    });
  }
  const progressBar = $("#scrollProgress");
  let progressTicking = false;
  function updateProgress() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progressBar.style.width = pct + "%";
    progressTicking = false;
  }
  window.addEventListener("scroll", () => {
    if (!progressTicking) {
      requestAnimationFrame(updateProgress);
      progressTicking = true;
    }
  });
  updateProgress();

  /* ---------- BUTTON RIPPLE + HOVER MICRO-INTERACTION ---------- */
  document.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest(".btn");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.4;
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = e.clientX - rect.left - size / 2 + "px";
    ripple.style.top = e.clientY - rect.top - size / 2 + "px";
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });

  /* ---------- DARK MODE ---------- */
  const darkToggle = $("#darkToggle");
  const darkToggleIcon = $("#darkToggleIcon");
  const savedTheme = localStorage.getItem("patahela_theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    if (darkToggleIcon) darkToggleIcon.className = "fa-solid fa-sun";
  }
  darkToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    if (darkToggleIcon) darkToggleIcon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
    localStorage.setItem("patahela_theme", isDark ? "dark" : "light");
  });

  /* ---------- PER-COUNTRY LOAN AMOUNT TIERS ---------- */
  // Illustrative tiers per market — not financial advice. Every market now
  // shares the same five-step ladder, topping out at 500,000.
  const AMOUNT_TIERS = {
    KES: [50000, 100000, 200000, 300000, 500000],
    ZMW: [50000, 100000, 200000, 300000, 500000],
    GHS: [50000, 100000, 200000, 300000, 500000],
    UGX: [50000, 100000, 200000, 300000, 500000],
    TZS: [50000, 100000, 200000, 300000, 500000],
    ZAR: [50000, 100000, 200000, 300000, 500000],
    XOF: [50000, 100000, 200000, 300000, 500000],
    EGP: [50000, 100000, 200000, 300000, 500000],
  };
  const countrySelect = $("#country");
  const amountSelect = $("#amount");
  const amountCurrencyTag = $("#amountCurrencyTag");

  function populateAmountOptions(countryCode, preferredValue) {
    const tiers = AMOUNT_TIERS[countryCode] || AMOUNT_TIERS.KES;
    amountSelect.innerHTML = '<option value="">Select amount</option>' +
      tiers.map((n) => `<option value="${n}">${countryCode} ${n.toLocaleString()}</option>`).join("");
    if (preferredValue && tiers.includes(Number(preferredValue))) {
      amountSelect.value = String(preferredValue);
    }
    if (amountCurrencyTag) amountCurrencyTag.textContent = `(${countryCode})`;
  }

  countrySelect.addEventListener("change", () => populateAmountOptions(countrySelect.value));
  populateAmountOptions(countrySelect.value);

  /* ---------- FORM AUTOSAVE ---------- */
  const form = $("#loanForm");
  const FIELDS = ["fullName", "phone", "idNumber", "email", "country", "amount", "period", "purpose"]; // password excluded from storage
  const STORAGE_KEY = "patahela_draft";

  function loadDraft() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (saved.country && form.elements.country) form.elements.country.value = saved.country;
      populateAmountOptions(countrySelect.value, saved.amount);
      FIELDS.forEach((f) => {
        if (f === "country" || f === "amount") return; // already handled above
        if (saved[f] && form.elements[f]) form.elements[f].value = saved[f];
      });
    } catch (e) { /* ignore corrupt draft */ }
  }
  function saveDraft() {
    const data = {};
    FIELDS.forEach((f) => { data[f] = form.elements[f] ? form.elements[f].value : ""; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  loadDraft();
  form.addEventListener("input", saveDraft);

  /* ---------- VALIDATION ---------- */
  function setError(field, message) {
    const el = document.querySelector(`[data-error-for="${field}"]`);
    const input = form.elements[field];
    if (el) el.textContent = message || "";
    if (input) input.classList.toggle("invalid", !!message);
  }

  function validate() {
    let ok = true;
    const v = (name) => (form.elements[name]?.value || "").trim();

    if (!v("fullName")) { setError("fullName", "Enter your full name"); ok = false; }
    else setError("fullName", "");

    if (!/^[0-9+\-\s]{7,15}$/.test(v("phone"))) { setError("phone", "Enter a valid phone number"); ok = false; }
    else setError("phone", "");

    if (!v("idNumber")) { setError("idNumber", "Enter your ID number"); ok = false; }
    else setError("idNumber", "");

    if (v("password").length < 6) { setError("password", "At least 6 characters"); ok = false; }
    else setError("password", "");

    if (!v("amount")) { setError("amount", "Select a loan amount"); ok = false; }
    else setError("amount", "");

    if (!v("period")) { setError("period", "Select a repayment period"); ok = false; }
    else setError("period", "");

    if (!v("purpose")) { setError("purpose", "Select a purpose"); ok = false; }
    else setError("purpose", "");

    return ok;
  }

  /* ---------- SUBMIT FLOW ---------- */
  const loadingOverlay = $("#loadingOverlay");
  const summaryModal = $("#summaryModal");
  const summaryList = $("#summaryList");
  const sheetBtn = $("#sheetBtn");
  const sheetBtnIcon = $("#sheetBtnIcon");
  const sheetBtnLabel = $("#sheetBtnLabel");
  const closeModalXBtn = $("#closeModalX");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) {
      const firstInvalid = form.querySelector(".invalid");
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    loadingOverlay.classList.remove("hidden");

    // Matches the 5-second loading beat from the original flow sketch.
    setTimeout(() => {
      loadingOverlay.classList.add("hidden");
      resetSheetBtn();
      showSummary();
      summaryModal.classList.remove("hidden");
    }, 5000);
  });

  function fieldVal(name) {
    return form.elements[name] ? form.elements[name].value.trim() : "";
  }

  function currentData() {
    return {
      fullName: fieldVal("fullName"),
      phone: fieldVal("phone"),
      idNumber: fieldVal("idNumber"),
      email: fieldVal("email"),
      country: fieldVal("country"),
      amount: fieldVal("amount"),
      period: fieldVal("period"),
      purpose: fieldVal("purpose"),
    };
  }

  function showSummary() {
    const d = currentData();
    summaryList.innerHTML = `
      <div><dt>Name</dt><dd>${escapeHtml(d.fullName)}</dd></div>
      <div><dt>Phone</dt><dd>${escapeHtml(d.phone)}</dd></div>
      <div><dt>ID number</dt><dd>${escapeHtml(d.idNumber)}</dd></div>
      <div><dt>Amount</dt><dd>${escapeHtml(d.country)} ${escapeHtml(Number(d.amount).toLocaleString())}</dd></div>
      <div><dt>Repayment</dt><dd>${escapeHtml(d.period)}</dd></div>
      <div><dt>Purpose</dt><dd>${escapeHtml(d.purpose)}</dd></div>
    `;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  /* ---------- SCROLL REVEAL ---------- */
  const revealEls = $$(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------- STAGGERED REVEAL (grids / lists) ---------- */
  const staggerGroups = $$(".stagger");
  if (staggerGroups.length && "IntersectionObserver" in window) {
    const staggerObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const items = entry.target.querySelectorAll(".reveal-item");
          items.forEach((el, i) => {
            el.style.transitionDelay = `${i * 70}ms`;
            el.classList.add("in-view");
          });
          staggerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    staggerGroups.forEach((g) => staggerObserver.observe(g));
  } else {
    $$(".reveal-item").forEach((el) => el.classList.add("in-view"));
  }

  /* ---------- STAT COUNTERS ---------- */
  const statEls = $$(".stat-num");
  if (statEls.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    statEls.forEach((el) => observer.observe(el));
  } else {
    statEls.forEach((el) => animateCount(el));
  }

  function animateCount(el) {
    const target = parseFloat(el.getAttribute("data-count"));
    const decimals = parseInt(el.getAttribute("data-decimal") || "0", 10);
    const suffix = el.getAttribute("data-suffix") || "";
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = value.toLocaleString(undefined, {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals,
      }) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  async function notifyApplication(data) {
    const res = await fetch(NOTIFY_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timestamp: new Date().toISOString(), ...data }),
    });
    if (!res.ok) throw new Error(`Webhook responded with ${res.status}`);
  }

  function resetSheetBtn() {
    sheetBtn.disabled = false;
    sheetBtn.classList.remove("is-loading", "is-sent");
    sheetBtnIcon.className = "fa-solid fa-paper-plane";
    sheetBtnLabel.textContent = "Send";
  }

  sheetBtn.addEventListener("click", async () => {
    const d = currentData();
    sheetBtn.disabled = true;
    sheetBtn.classList.add("is-loading");
    sheetBtnIcon.className = "fa-solid fa-spinner fa-spin";
    sheetBtnLabel.textContent = "Sending…";

    try {
      await notifyApplication({
        fullName: d.fullName,
        phone: d.phone,
        idNumber: d.idNumber,
        email: d.email,
        country: d.country,
        amount: d.amount,
        period: d.period,
        purpose: d.purpose,
      });
      sheetBtn.classList.remove("is-loading");
      sheetBtn.classList.add("is-sent");
      sheetBtnIcon.className = "fa-solid fa-check";
      sheetBtnLabel.textContent = "Sent";
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      resetSheetBtn();
      alert("Couldn't reach our server — check your connection and try again.");
    }
  });

  closeModalXBtn.addEventListener("click", () => {
    summaryModal.classList.add("hidden");
    resetSheetBtn();
    showView("view-landing");
  });
});
