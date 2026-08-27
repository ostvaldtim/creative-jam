/**
 * ZOOM SYNC — Creative Jam Landing
 * Custom zoom system that replaces native browser zoom with CSS zoom.
 * Ensures consistent zoom level across all landing pages, even when
 * opened via file:// protocol (where Chrome stores zoom per-file).
 *
 * Controls:
 *   Ctrl + =  /  Ctrl + +   → Zoom In
 *   Ctrl + -                → Zoom Out
 *   Ctrl + 0                → Reset to 100%
 *
 * The zoom level is stored in localStorage and applied on every page load,
 * guaranteeing identical layout across index.html, cases.html, company.html.
 */
;(function () {
  'use strict';

  var STORAGE_KEY = 'cj_page_zoom';
  var MIN_ZOOM = 0.5;     // 50%
  var MAX_ZOOM = 2.0;     // 200%
  var ZOOM_STEP = 0.1;    // 10% per step
  var DEFAULT_ZOOM = 1.0; // 100%

  // ── Read saved zoom level ──
  function getSavedZoom() {
    try {
      var val = parseFloat(localStorage.getItem(STORAGE_KEY));
      if (!isNaN(val) && val >= MIN_ZOOM && val <= MAX_ZOOM) return val;
    } catch (e) {}
    return DEFAULT_ZOOM;
  }

  // ── Apply zoom via CSS ──
  function applyZoom(level) {
    // Round to avoid floating point artifacts (e.g. 1.1000000000000001)
    level = Math.round(level * 100) / 100;
    level = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));

    document.documentElement.style.zoom = level;
    try {
      localStorage.setItem(STORAGE_KEY, String(level));
    } catch (e) {}

    return level;
  }

  // ── Current zoom state ──
  var currentZoom = getSavedZoom();

  // ── Apply on page load (before first paint ideally) ──
  applyZoom(currentZoom);

  // ── Intercept Ctrl+=/Ctrl-/Ctrl+0 ──
  document.addEventListener('keydown', function (e) {
    // Only handle Ctrl (or Cmd on Mac) + zoom keys
    if (!(e.ctrlKey || e.metaKey)) return;

    var handled = false;

    // Ctrl + = or Ctrl + + (numpad) → Zoom In
    if (e.key === '=' || e.key === '+' || e.code === 'Equal' || e.code === 'NumpadAdd') {
      currentZoom = applyZoom(currentZoom + ZOOM_STEP);
      handled = true;
    }
    // Ctrl + - or Ctrl + - (numpad) → Zoom Out
    else if (e.key === '-' || e.code === 'Minus' || e.code === 'NumpadSubtract') {
      currentZoom = applyZoom(currentZoom - ZOOM_STEP);
      handled = true;
    }
    // Ctrl + 0 → Reset
    else if (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0') {
      currentZoom = applyZoom(DEFAULT_ZOOM);
      handled = true;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      showZoomIndicator(currentZoom);
    }
  }, true); // useCapture to intercept before browser

  // ── Also handle Ctrl+Scroll (mouse wheel zoom) ──
  document.addEventListener('wheel', function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;

    e.preventDefault();

    if (e.deltaY < 0) {
      // Scroll up → Zoom In
      currentZoom = applyZoom(currentZoom + ZOOM_STEP);
    } else if (e.deltaY > 0) {
      // Scroll down → Zoom Out
      currentZoom = applyZoom(currentZoom - ZOOM_STEP);
    }

    showZoomIndicator(currentZoom);
  }, { passive: false, capture: true });

  // ── Sync with other tabs via storage event ──
  window.addEventListener('storage', function (e) {
    if (e.key !== STORAGE_KEY) return;
    var newZoom = parseFloat(e.newValue);
    if (!isNaN(newZoom) && Math.abs(newZoom - currentZoom) > 0.01) {
      currentZoom = applyZoom(newZoom);
    }
  });

  // ── Also sync on focus (for file:// where storage events may not fire) ──
  window.addEventListener('focus', function () {
    var savedZoom = getSavedZoom();
    if (Math.abs(savedZoom - currentZoom) > 0.01) {
      currentZoom = applyZoom(savedZoom);
    }
  });

  // ── Visual zoom indicator (brief toast) ──
  var indicatorTimer = null;

  function showZoomIndicator(level) {
    var el = document.getElementById('cj-zoom-indicator');

    if (!el) {
      el = document.createElement('div');
      el.id = 'cj-zoom-indicator';
      el.style.cssText =
        'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);' +
        'padding:8px 20px;border-radius:100px;font-family:var(--font-mono,monospace);' +
        'font-size:13px;font-weight:600;color:#fff;z-index:99999;pointer-events:none;' +
        'background:rgba(20,20,20,0.9);border:1px solid rgba(255,104,0,0.3);' +
        'box-shadow:0 8px 32px rgba(0,0,0,0.4);backdrop-filter:blur(12px);' +
        'opacity:0;transition:opacity 0.2s ease,transform 0.2s ease;';
      document.body.appendChild(el);
    }

    var pct = Math.round(level * 100);
    el.textContent = '⌘ ' + pct + '%';
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';

    clearTimeout(indicatorTimer);
    indicatorTimer = setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(20px)';
    }, 1200);
  }

})();
