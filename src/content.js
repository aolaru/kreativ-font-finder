"use strict";

(() => {
  if (window.__kreativFontFinderLoaded) {
    return;
  }

  window.__kreativFontFinderLoaded = true;

  const HIGHLIGHT_CLASS = "kreativ-font-finder-highlight";
  const HIGHLIGHT_STYLE_ID = "kreativ-font-finder-highlight-style";
  const MAX_TEXT_ELEMENTS = 2200;
  const GENERIC_FAMILIES = new Set([
    "serif",
    "sans-serif",
    "monospace",
    "cursive",
    "fantasy",
    "math",
    "emoji",
    "fangsong",
    "system-ui",
    "ui-serif",
    "ui-sans-serif",
    "ui-monospace",
    "ui-rounded"
  ]);
  const SYSTEM_ALIASES = new Set([
    "-apple-system",
    "blinkmacsystemfont",
    "system-ui",
    "ui-sans-serif"
  ]);

  let highlightTimer = null;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || !message.type) {
      return false;
    }

    try {
      if (message.type === "KREATIV_SCAN_FONTS") {
        sendResponse({
          ok: true,
          ...scanFonts()
        });
        return true;
      }

      if (message.type === "KREATIV_HIGHLIGHT_FONT") {
        const count = highlightFont(message.family);
        sendResponse({ ok: true, count });
        return true;
      }

      if (message.type === "KREATIV_CLEAR_HIGHLIGHTS") {
        clearHighlights();
        sendResponse({ ok: true });
        return true;
      }
    } catch (error) {
      sendResponse({
        ok: false,
        error: error.message || "Unexpected Kreativ Font Finder error."
      });
      return true;
    }

    return false;
  });

  function scanFonts() {
    const fontFaceSources = collectFontFaceSources();
    const loadedFonts = collectLoadedFonts();
    const elements = getTextElements();
    const fonts = new Map();

    elements.forEach((element) => {
      const style = window.getComputedStyle(element);
      const stack = parseFontFamily(style.fontFamily);
      const family = choosePrimaryFamily(stack);

      if (!family) {
        return;
      }

      const key = canonicalFamily(family);
      const existing = fonts.get(key) || createFontRecord(family, stack, fontFaceSources, loadedFonts);
      const fontSize = normalizeFontSize(style.fontSize);
      const fontWeight = normalizeFontWeight(style.fontWeight);
      const color = style.color;
      const role = classifyRole(element);

      existing.count += 1;
      existing.stack = preferLongerStack(existing.stack, stack);
      addCount(existing.sizes, fontSize);
      addCount(existing.weights, fontWeight);
      addCount(existing.colors, color);
      addCount(existing.roles, role);

      if (!existing.sample) {
        existing.sample = getSampleText(element);
      }

      fonts.set(key, existing);
    });

    return {
      pageTitle: document.title || "",
      hostname: window.location.hostname || window.location.href,
      scannedElements: elements.length,
      fonts: Array.from(fonts.values())
        .map(finalizeFontRecord)
        .sort((a, b) => b.count - a.count || a.family.localeCompare(b.family))
        .slice(0, 80)
    };
  }

  function getTextElements() {
    const root = document.body;
    const elements = new Set();

    if (!root) {
      return [];
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        const parent = node.parentElement;
        if (!parent || shouldSkipElement(parent)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    });

    while (elements.size < MAX_TEXT_ELEMENTS) {
      const node = walker.nextNode();
      if (!node) {
        break;
      }

      const element = node.parentElement;
      if (element && !elements.has(element) && isVisibleElement(element)) {
        elements.add(element);
      }
    }

    return Array.from(elements);
  }

  function shouldSkipElement(element) {
    const tag = element.tagName.toLowerCase();

    if (["script", "style", "noscript", "template", "svg", "canvas"].includes(tag)) {
      return true;
    }

    return Boolean(element.closest("[hidden], [aria-hidden='true']"));
  }

  function isVisibleElement(element) {
    const style = window.getComputedStyle(element);

    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.visibility === "collapse" ||
      Number(style.opacity) === 0
    ) {
      return false;
    }

    return element.getClientRects().length > 0;
  }

  function parseFontFamily(value) {
    const families = [];
    let current = "";
    let quote = "";

    String(value || "").split("").forEach((char) => {
      if ((char === "\"" || char === "'") && !quote) {
        quote = char;
        return;
      }

      if (char === quote) {
        quote = "";
        return;
      }

      if (char === "," && !quote) {
        pushFamily(families, current);
        current = "";
        return;
      }

      current += char;
    });

    pushFamily(families, current);
    return families;
  }

  function pushFamily(families, value) {
    const family = normalizeFamilyName(value);
    if (family) {
      families.push(family);
    }
  }

  function normalizeFamilyName(value) {
    return String(value || "")
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/\s+/g, " ");
  }

  function choosePrimaryFamily(stack) {
    if (!stack.length) {
      return "";
    }

    const first = stack[0];
    const firstKey = canonicalFamily(first);

    if (SYSTEM_ALIASES.has(firstKey)) {
      return "System UI";
    }

    return stack.find((family) => !GENERIC_FAMILIES.has(canonicalFamily(family))) || first;
  }

  function createFontRecord(family, stack, fontFaceSources, loadedFonts) {
    return {
      family,
      stack,
      source: getFontSource(family, fontFaceSources, loadedFonts),
      count: 0,
      sample: "",
      sizes: new Map(),
      weights: new Map(),
      colors: new Map(),
      roles: new Map()
    };
  }

  function finalizeFontRecord(record) {
    return {
      family: record.family,
      stack: record.stack,
      cssFontFamily: toCssFontFamily(record.stack),
      source: record.source,
      count: record.count,
      sample: record.sample,
      sizes: topCounts(record.sizes, 5),
      weights: topCounts(record.weights, 5),
      colors: topCounts(record.colors, 6),
      roles: topCounts(record.roles, 4)
    };
  }

  function preferLongerStack(currentStack, nextStack) {
    return nextStack.length > currentStack.length ? nextStack : currentStack;
  }

  function toCssFontFamily(stack) {
    return stack
      .map((family) => {
        if (/^[a-z0-9_-]+$/i.test(family)) {
          return family;
        }

        return `"${family.replace(/"/g, "\\\"")}"`;
      })
      .join(", ");
  }

  function addCount(map, value) {
    if (!value) {
      return;
    }

    map.set(value, (map.get(value) || 0) + 1);
  }

  function topCounts(map, limit) {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
      .slice(0, limit)
      .map(([value, count]) => ({ value, count }));
  }

  function normalizeFontSize(value) {
    const size = Number.parseFloat(value);
    if (!Number.isFinite(size)) {
      return value || "";
    }

    const rounded = Math.round(size * 10) / 10;
    return `${rounded}px`;
  }

  function normalizeFontWeight(value) {
    if (value === "normal") {
      return "400";
    }

    if (value === "bold") {
      return "700";
    }

    return value || "";
  }

  function getSampleText(element) {
    return String(element.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 110);
  }

  function classifyRole(element) {
    const tag = element.tagName.toLowerCase();

    if (/^h[1-6]$/.test(tag) || element.closest("h1, h2, h3, h4, h5, h6")) {
      return "Heading";
    }

    if (element.closest("nav, [role='navigation']")) {
      return "Navigation";
    }

    if (tag === "button" || tag === "a" || element.closest("button, a, [role='button']")) {
      return "Action";
    }

    if (["label", "input", "select", "textarea"].includes(tag) || element.closest("form")) {
      return "Form";
    }

    if (["p", "li", "blockquote", "figcaption", "dd", "dt"].includes(tag)) {
      return "Body";
    }

    return "Text";
  }

  function collectLoadedFonts() {
    const loadedFonts = new Set();

    if (!document.fonts || typeof document.fonts.forEach !== "function") {
      return loadedFonts;
    }

    document.fonts.forEach((fontFace) => {
      const family = normalizeFamilyName(fontFace.family);
      if (family) {
        loadedFonts.add(canonicalFamily(family));
      }
    });

    return loadedFonts;
  }

  function collectFontFaceSources() {
    const sources = new Map();

    Array.from(document.styleSheets).forEach((sheet) => {
      let rules;

      try {
        rules = sheet.cssRules;
      } catch {
        return;
      }

      collectSourcesFromRules(rules, sources);
    });

    return sources;
  }

  function collectSourcesFromRules(rules, sources) {
    Array.from(rules || []).forEach((rule) => {
      if (isFontFaceRule(rule)) {
        const family = normalizeFamilyName(rule.style.getPropertyValue("font-family"));
        const src = rule.style.getPropertyValue("src");

        if (family) {
          sources.set(canonicalFamily(family), classifyFontSource(src));
        }

        return;
      }

      const nestedRules = getNestedRules(rule);
      if (nestedRules) {
        collectSourcesFromRules(nestedRules, sources);
      }
    });
  }

  function getNestedRules(rule) {
    try {
      return rule.cssRules || null;
    } catch {
      return null;
    }
  }

  function isFontFaceRule(rule) {
    return rule && (rule.type === CSSRule.FONT_FACE_RULE || rule.constructor.name === "CSSFontFaceRule");
  }

  function classifyFontSource(src) {
    const source = String(src || "").toLowerCase();

    if (source.includes("fonts.gstatic.com") || source.includes("fonts.googleapis.com")) {
      return "Google Fonts";
    }

    if (source.includes("use.typekit.net") || source.includes("p.typekit.net")) {
      return "Adobe Fonts";
    }

    if (source.includes("cloud.typography.com")) {
      return "Hoefler Cloud";
    }

    if (source.includes("url(")) {
      return "Custom web font";
    }

    return "Web font";
  }

  function getFontSource(family, fontFaceSources, loadedFonts) {
    const key = canonicalFamily(family);

    if (fontFaceSources.has(key)) {
      return fontFaceSources.get(key);
    }

    if (loadedFonts.has(key)) {
      return "Loaded web font";
    }

    if (family === "System UI" || SYSTEM_ALIASES.has(key) || GENERIC_FAMILIES.has(key)) {
      return "System/fallback";
    }

    return "System/fallback";
  }

  function highlightFont(family) {
    const key = canonicalFamily(family);
    let count = 0;

    clearHighlights();
    ensureHighlightStyle();

    const elements = getTextElements();

    elements.forEach((element) => {
      const stack = parseFontFamily(window.getComputedStyle(element).fontFamily);
      const elementFamily = choosePrimaryFamily(stack);

      if (canonicalFamily(elementFamily) === key) {
        element.classList.add(HIGHLIGHT_CLASS);
        count += 1;
      }
    });

    if (highlightTimer) {
      window.clearTimeout(highlightTimer);
    }

    highlightTimer = window.setTimeout(clearHighlights, 10000);
    return count;
  }

  function ensureHighlightStyle() {
    if (document.getElementById(HIGHLIGHT_STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = HIGHLIGHT_STYLE_ID;
    style.textContent = `
      .${HIGHLIGHT_CLASS} {
        outline: 2px solid #4a4aff !important;
        outline-offset: 2px !important;
        background-color: rgba(255, 51, 102, 0.12) !important;
        box-shadow: 0 0 0 4px rgba(74, 74, 255, 0.14) !important;
      }
    `;
    document.documentElement.appendChild(style);
  }

  function clearHighlights() {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((element) => {
      element.classList.remove(HIGHLIGHT_CLASS);
    });

    if (highlightTimer) {
      window.clearTimeout(highlightTimer);
      highlightTimer = null;
    }
  }

  function canonicalFamily(family) {
    return normalizeFamilyName(family).toLowerCase();
  }
})();
