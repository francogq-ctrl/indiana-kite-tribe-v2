const WA_NUMBER = "5585992792065";
const STORAGE_KEY = "indiana-tribe-v2-lang";
const LANGS = ["es", "pt", "en"];

let dict = null;
let lang = "es";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function detectLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && LANGS.includes(stored)) return stored;
  const nav = (navigator.language || "es").toLowerCase();
  if (nav.startsWith("pt")) return "pt";
  if (nav.startsWith("en")) return "en";
  return "es";
}

function lookup(key) {
  if (!dict || !dict[lang]) return "";
  return key.split(".").reduce((acc, part) => (acc == null ? acc : acc[part]), dict[lang]);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function applyI18n() {
  if (!dict) return;
  document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;

  $$("[data-i18n]").forEach((el) => {
    const val = lookup(el.dataset.i18n);
    if (typeof val !== "string") return;
    el.textContent = val;
    if (el.classList.contains("story-wind")) el.hidden = !val;
  });

  const title = lookup("meta.title");
  if (title) document.title = title;
  const desc = lookup("meta.description");
  const meta = $('meta[name="description"]');
  if (desc && meta) meta.setAttribute("content", desc);

  $$("[data-lang]").forEach((btn) => {
    btn.setAttribute("aria-pressed", btn.dataset.lang === lang ? "true" : "false");
  });

  $$("[data-wa]").forEach((a) => {
    const msg = lookup(`wa.${a.dataset.wa}`);
    if (msg) a.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  });

  $$("[data-waypoints]").forEach((ul) => {
    const items = lookup(ul.dataset.waypoints);
    if (!Array.isArray(items)) return;
    ul.innerHTML = items.map((w) => `<li>${escapeHtml(w)}</li>`).join("");
  });

  $$("[data-story-body]").forEach((el) => {
    const items = lookup(el.dataset.storyBody);
    if (!Array.isArray(items)) return;
    el.innerHTML = items.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  });
}

async function loadI18n() {
  try {
    const res = await fetch("i18n.json");
    if (!res.ok) throw new Error(res.status);
    dict = await res.json();
    lang = detectLang();
    applyI18n();
  } catch (err) {
    console.warn("i18n.json no cargó. Corré ./preview.sh", err);
    lang = "es";
  }
}

function initLangSwitcher() {
  $$("[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      lang = btn.dataset.lang;
      localStorage.setItem(STORAGE_KEY, lang);
      applyI18n();
    });
  });
}

function initNav() {
  const toggle = $(".menu-toggle");
  const links = $(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function phImg(img) {
  const slot = img.dataset.slot;
  if (!slot) return;
  const jpg = new Image();
  jpg.onload = () => {
    img.src = `assets/${slot}.jpg`;
    img.closest(".media")?.classList.add("has-photo");
  };
  jpg.src = `assets/${slot}.jpg`;
}

function initReveal() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    $$(".reveal").forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  $$(".reveal").forEach((el) => io.observe(el));
}

function boot() {
  $$("img[data-slot]").forEach(phImg);
  initLangSwitcher();
  initNav();
  initReveal();
}

loadI18n().finally(boot);
