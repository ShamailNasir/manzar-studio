/* ══════════════════════════════════════════════════════════════════════
   MANZAR SYSTEM — manzar-system.js
   Shared behaviour for manzar.studio + Manzar Labs.

   Plain ES2019, no modules, no dependencies. Safe to load with <script
   defer> on both sites. Every function below is a no-op if the markup it
   needs isn't on the page — the two sites have different DOMs, and this
   file must never throw because of that.

   Public API — window.MZ:
     MZ.clocks()    live [data-clock="<IANA zone>"] elements
     MZ.nav()       auto-hide / hairline on .mz-nav
     MZ.here()      the "you are here" section readout in the nav
                     (called by nav(); returns its own updater)
     MZ.switcher()  wires .mz-switch-opt, runs the crossover curtain
     MZ.arrive()    lifts a curtain left running by the previous page
     MZ.magnetic()  [data-magnetic] pointer-follow
     MZ.menu()      the top-sheet nav menu (open/close, focus trap,
                     feature-panel preview swap) — see .mz-menu in
                     manzar-system.css for the full markup contract
     MZ.init()      runs all of the above; auto-run on DOMContentLoaded
     MZ.prefersReducedMotion  boolean, read once at load
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var prefersReducedMotion = false;
  try {
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* no matchMedia: assume motion is fine */ }

  var EASE_SPRING = 'cubic-bezier(.34,1.4,.64,1)';

  var NAV_HIDE_AT       = 240; // px scrolled down before the nav auto-hides
  var NAV_HAIRLINE_AT   = 40;  // px scrolled before the bottom hairline fades in
  var MAGNETIC_RADIUS   = 60;  // px the pointer must be within to pull an element
  var CURTAIN_COVER_MS  = 420; // wipe-up duration — matches .mz-curtain in CSS
  var CURTAIN_LIFT_MS   = 520; // lift/reveal duration on arrival
  var CURTAIN_FAIL_MS   = 2500; // if navigation never lands, lift anyway
  var CURTAIN_HOLD_MAX  = 1000; // longest the arriving page may hold the curtain up

  var ROOM_NAME = { studio: 'Studio', labs: 'Labs' }; // logo already says MANZAR

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ----------------------------------------------------------------------
     MZ.clocks — every [data-clock="<IANA zone>"], one shared 1s interval
     ---------------------------------------------------------------------- */
  var clockTimer = null;

  function clocks() {
    var els = qsa('[data-clock]');
    if (!els.length) return;

    function tick() {
      var now = new Date();
      for (var i = 0; i < els.length; i++) {
        var tz = els[i].getAttribute('data-clock');
        if (!tz) continue;
        try {
          els[i].textContent = new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false, timeZone: tz
          }).format(now);
        } catch (e) {
          /* unrecognised zone: leave whatever was already there */
        }
      }
    }

    tick();
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(tick, 1000);
  }

  /* ----------------------------------------------------------------------
     MZ.here — the "you are here" readout in .mz-nav-left.

     Labels are keyed by section id so the markup stays clean and one map
     covers all seven pages; a section can override with data-nav-label, and
     anything not listed is simply not tracked (hero art, doorways, CTAs —
     they aren't places you navigate to). Ids that appear on more than one
     page mean the same thing on both, which is why one map works.

     Returns an updater for nav() to call inside its existing rAF tick, or
     null when the page has no readout / no tracked sections.
     ---------------------------------------------------------------------- */
  var HERE_LABELS = {
    /* manzar.studio */
    hero: 'Overview', manifesto: 'Manifesto', conv: 'Approach',
    work: 'Work', labs: 'Labs', services: 'Services', reel: 'Showreel',
    process: 'Process', faq: 'FAQ', studio: 'Studio', contact: 'Contact',
    /* Labs */
    mission: 'Mission', team: 'Team',
    /* the cross-world doorway that closes Labs + every capability page */
    'studio-return': 'Studio',
    /* pricing */
    top: 'Overview', models: 'Engagements', changes: 'Scope', cta: 'Start',
    /* capability pages */
    'what-we-do': 'What we do', 'how-it-ships': 'How it ships',
    stack: 'Stack', proof: 'Proof', 'pricing-pointer': 'Pricing'
  };

  var HERE_OFFSET = 96;   // nav height + a little: where "the section starts"

  function here() {
    var box = document.querySelector('.mz-nav-here');
    if (!box) return null;
    var labEl = box.querySelector('.mz-nav-here-label');
    if (!labEl) return null;

    var nodes = qsa('section[id], [data-nav-label]');
    var items = [];
    for (var i = 0; i < nodes.length; i++) {
      var label = nodes[i].getAttribute('data-nav-label');
      if (!label) label = HERE_LABELS[nodes[i].id];
      if (label) items.push({ el: nodes[i], label: label });
    }
    /* Nothing to track (a bare page, or ids we don't know): hide the readout
       rather than leave a stale "01 Overview" sitting in the bar. */
    if (!items.length) { box.style.display = 'none'; return null; }

    var current = -1;
    var swapTimer = null;

    function show(i) {
      if (i === current) return;
      current = i;
      var label = items[i].label;

      if (prefersReducedMotion) {
        labEl.textContent = label;
        return;
      }
      box.classList.add('is-out');
      if (swapTimer) clearTimeout(swapTimer);
      swapTimer = setTimeout(function () {
        labEl.textContent = label;
        box.classList.remove('is-out');
      }, 200); /* matches the .2s swap in manzar-system.css §3.1 */
    }

    /* Current = the last section whose top has passed under the bar. Read
       live from the layout rather than from cached offsets: these pages lazy-
       load imagery and grow after load, and a cached offset table goes wrong
       silently. A dozen rect reads inside an already-scheduled frame is
       cheap, and they all happen together, so there's no read/write thrash. */
    function update() {
      var found = 0;
      for (var i = 0; i < items.length; i++) {
        if (items[i].el.getBoundingClientRect().top <= HERE_OFFSET) found = i;
        else break;
      }
      show(found);
    }

    update();
    return update;
  }

  /* ----------------------------------------------------------------------
     MZ.nav — auto-hide on scroll down past NAV_HIDE_AT, reveal on scroll
     up, hairline once past NAV_HAIRLINE_AT. Passive scroll + scrollY, so
     it works the same whether the page runs Lenis or native scroll.
     Also drives the "you are here" readout, so the whole bar updates from
     one rAF tick.
     ---------------------------------------------------------------------- */
  function nav() {
    var el = document.querySelector('.mz-nav');
    if (!el) return;

    var updateHere = here();

    var lastY = window.scrollY || window.pageYOffset || 0;
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset || 0;

      el.classList.toggle('mz-nav--scrolled', y > NAV_HAIRLINE_AT);

      if (y > lastY && y > NAV_HIDE_AT) {
        el.classList.add('mz-nav--hidden');
      } else if (y < lastY) {
        el.classList.remove('mz-nav--hidden');
      }
      lastY = y;

      if (updateHere) updateHere();
    }

    update();
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener('resize', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
  }

  /* ----------------------------------------------------------------------
     .mz-curtain helpers — shared by switcher() (leaving) and arrive()
     (arriving). Built on demand if the page doesn't already have one.
     ---------------------------------------------------------------------- */
  function ensureCurtain() {
    var el = document.querySelector('.mz-curtain');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'mz-curtain';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="mz-curtain-in">' +
        '<img class="mz-curtain-logo" src="' + assetsRoot() + 'manzar-wordmark.png" alt="" ' +
             'width="2556" height="980" decoding="async">' +
        '<span class="mz-curtain-room"></span>' +
      '</div>';
    document.body.appendChild(el);
    return el;
  }

  function setCurtainWorld(curtainEl, world) {
    var room = curtainEl.querySelector('.mz-curtain-room');
    if (room) room.textContent = ROOM_NAME[world] || '';
  }

  // Every path on this site is relative, and this script is shared by pages at two
  // different depths, so the curtain cannot hardcode an asset URL. Derive the assets
  // root from the stylesheet link the page already resolved correctly.
  function assetsRoot() {
    var link = document.querySelector('link[href*="manzar-system.css"]');
    var href = link ? link.getAttribute('href') : 'assets/css/manzar-system.css';
    return href.replace(/css\/manzar-system\.css.*$/, '');
  }

  /* ----------------------------------------------------------------------
     MZ.switcher — wires .mz-switch-opt links. Clicking the *inactive*
     world runs the crossover curtain, then navigates.
     ---------------------------------------------------------------------- */
  /* Park the curtain back below the viewport with no animation at all.
     Simply dropping the state classes lets the base transition run the panel
     from -100% back down to its resting +100% — straight through 0%, i.e. a
     full black wipe over the page it had just revealed. See .mz-curtain--instant
     in manzar-system.css. */
  function parkCurtain(curtain) {
    if (!curtain) return;
    releaseScrollGuard(curtain);
    curtain.classList.add('mz-curtain--instant');
    curtain.classList.remove('mz-curtain--cover', 'mz-curtain--lift');
    void curtain.offsetHeight; // commit the parked transform before transitions return
    curtain.classList.remove('mz-curtain--instant');
  }

  // Shared teardown for the crossover curtain.
  function uncoverCurtain(curtain) {
    if (!curtain) return;
    curtain.classList.add('mz-curtain--lift');
    window.setTimeout(function () { parkCurtain(curtain); }, CURTAIN_LIFT_MS + 60);
  }

  // Hands off from the first-paint ink shim (see html.mz-crossing in the CSS)
  // once the real curtain is up, or if there turns out to be nothing to lift.
  function clearCrossingShim() {
    document.documentElement.classList.remove('mz-crossing');
  }

  /* The curtain covers everything visually, but pointer-events does not stop a
     wheel or a swipe from scrolling the page behind it — and on arrival it now
     holds for as long as the page needs to settle. Without this a visitor who
     kept scrolling through the transition would be revealed somewhere mid-page. */
  function swallowScroll(e) {
    e.preventDefault();
    e.stopPropagation(); // Lenis listens on window; stop it seeing this at all
  }

  function holdScrollGuard(curtain) {
    curtain.addEventListener('wheel', swallowScroll, { passive: false });
    curtain.addEventListener('touchmove', swallowScroll, { passive: false });
  }

  function releaseScrollGuard(curtain) {
    curtain.removeEventListener('wheel', swallowScroll, { passive: false });
    curtain.removeEventListener('touchmove', swallowScroll, { passive: false });
  }

  /* Run cb once the arriving page can actually be revealed without stuttering:
     webfonts resolved (a late swap reflows every headline) and the load event
     drained, then two clear frames so the reveal starts on a free main thread.
     Lifting on DOMContentLoaded — which is when arrive() runs — put the 520ms
     transition head to head with SplitText, ScrollTrigger and image decodes, and
     the dropped frames read as a stutter mid-wipe. Hard-capped: a slow asset must
     never be able to trap a visitor behind the curtain. */
  function afterPageSettled(cb) {
    var fired = false;
    var pending = 1; // the load event, counted below

    function fire() {
      if (fired) return;
      fired = true;
      window.clearTimeout(cap);
      cb();
    }

    var cap = window.setTimeout(fire, CURTAIN_HOLD_MAX);

    function step() {
      if (--pending > 0) return;
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(fire);
      });
    }

    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      pending++;
      document.fonts.ready.then(step, step);
    }

    if (document.readyState === 'complete') window.setTimeout(step, 0);
    else window.addEventListener('load', step, { once: true });
  }

  // Restoring from the back/forward cache replays the DOM exactly as it was left,
  // curtain included. Clear it whenever the page is shown again.
  function guardCurtainOnRestore() {
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      clearCrossingShim();
      var c = document.querySelector('.mz-curtain');
      if (c && c.classList.contains('mz-curtain--cover')) {
        try { sessionStorage.removeItem('mz-crossover'); } catch (err) {}
        parkCurtain(c);
      }
    });
  }

  function switcher() {
    // [data-crossover="labs|studio"] lets any link opt into the same transition.
    // index.html used to carry its own copy of this whole routine for the two
    // standalone Labs CTAs, which then drifted: it still built the pre-logo
    // curtain markup and rendered an empty panel. One implementation only.
    var opts = qsa('.mz-switch-opt, [data-crossover]');
    if (!opts.length) return;

    opts.forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (link.classList.contains('is-on')) return; // already this world

        // let the browser handle new-tab / new-window intents normally
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;

        var world = link.getAttribute('data-world') || link.getAttribute('data-crossover');
        var href = link.getAttribute('href');
        if (!world || !href) return;

        e.preventDefault();

        if (prefersReducedMotion) {
          try { sessionStorage.setItem('mz-crossover', world); } catch (err) {}
          window.location.href = href;
          return;
        }

        var curtain = ensureCurtain();
        setCurtainWorld(curtain, world);
        void curtain.offsetHeight; // force layout so the class below transitions
        curtain.classList.add('mz-curtain--cover');

        window.setTimeout(function () {
          try { sessionStorage.setItem('mz-crossover', world); } catch (err) {}
          window.location.href = href;
          // Failsafe. If that navigation never lands, the curtain would sit there
          // forever and the whole site reads as frozen — which is exactly what a
          // dead href or a blocked navigation produces. Give it a beat, then lift
          // and clear the flag so a visitor is never trapped behind it.
          window.setTimeout(function () {
            try { sessionStorage.removeItem('mz-crossover'); } catch (err) {}
            uncoverCurtain(curtain);
          }, CURTAIN_FAIL_MS);
        }, CURTAIN_COVER_MS);
      });
    });
  }

  /* ----------------------------------------------------------------------
     MZ.arrive — on load, if a crossover is in flight: clear the flag,
     skip this page's own preloader, and lift the same curtain so the two
     pages read as one continuous shot.
     ---------------------------------------------------------------------- */
  function arrive() {
    var world;
    try { world = sessionStorage.getItem('mz-crossover'); } catch (e) { world = null; }
    if (!world) { clearCrossingShim(); return; }

    try { sessionStorage.removeItem('mz-crossover'); } catch (e) {}
    try { sessionStorage.setItem('mz-pre', '1'); } catch (e) {}

    try {
      document.dispatchEvent(new CustomEvent('mz:skip-preloader', { detail: { world: world } }));
    } catch (e) { /* no CustomEvent support: the sessionStorage flag above still works */ }

    if (prefersReducedMotion) { clearCrossingShim(); return; } // plain nav, nothing to lift

    var curtain = ensureCurtain();
    setCurtainWorld(curtain, world);

    /* Land already covering, logo already up, nothing animating: this is a
       continuation of the frame the previous page ended on, not a new entrance.
       --instant is what makes that true — without it the logo re-ran its own
       fade-in while the curtain was lifting away. */
    curtain.classList.add('mz-curtain--instant', 'mz-curtain--cover');
    void curtain.offsetHeight;
    holdScrollGuard(curtain);
    clearCrossingShim(); // the real curtain has the screen now

    afterPageSettled(function () {
      curtain.classList.remove('mz-curtain--instant');
      void curtain.offsetHeight; // re-arm transitions from the covered state

      /* The page's own intro (hero timeline, split headlines) starts here rather
         than on arrival, so it plays into the reveal instead of being spent
         behind the curtain. Pages that don't listen are unaffected. */
      try {
        document.dispatchEvent(new CustomEvent('mz:crossover-reveal', { detail: { world: world } }));
      } catch (e) {}

      curtain.classList.add('mz-curtain--lift');
      window.setTimeout(function () { parkCurtain(curtain); }, CURTAIN_LIFT_MS + 60);
    });
  }

  /* ----------------------------------------------------------------------
     MZ.menu — the top-sheet nav menu ("the flight deck"). Wires any
     [data-menu-toggle] trigger(s) to the single .mz-menu panel + its
     .mz-menu-scrim. No-op if the panel isn't on the page, so pages that
     still carry the old drawer (or none at all) are unaffected.

     Contract (see .mz-menu in manzar-system.css for the full markup):
       [data-menu-toggle]        opens/closes, gets aria-expanded + .is-open
       [data-menu-close]         scrim + close button, closes on click
       .mz-menu-row              each nav "record"; data-preview / data-kicker
                                  drive the feature panel on hover + focus
       [data-menu-feature]       feature panel root; data-default-preview /
                                  data-default-kicker / data-default-caption
                                  are shown when no row is hovered/focused
       [data-menu-feature-img]   <img> swapped by data-preview
       [data-menu-feature-kicker] / [data-menu-feature-caption]
     ---------------------------------------------------------------------- */
  function menu() {
    var panel = document.querySelector('.mz-menu');
    if (!panel) return; // page has no menu markup — safe no-op

    var scrim     = document.querySelector('.mz-menu-scrim');
    var triggers  = qsa('[data-menu-toggle]');
    var closers   = qsa('[data-menu-close]');
    var rows      = qsa('.mz-menu-row', panel);
    var featureEl = panel.querySelector('[data-menu-feature]');
    var featureImg     = panel.querySelector('[data-menu-feature-img]');
    var featureKicker  = panel.querySelector('[data-menu-feature-kicker]');
    var featureCaption = panel.querySelector('[data-menu-feature-caption]');
    var footEl    = panel.querySelector('.mz-menu-foot');

    var isOpen      = false;
    var lastFocused  = null;
    var preloaded    = false;
    var activeRow    = null;
    var openFocusTimer = null;
    var footResizeObserver = null;

    // Measures the foot bar's real rendered height (switcher / mail /
    // clocks / CTA — tallest in its single-column mobile layout) and
    // writes it as --menu-foot-h, which .mz-menu-body's mobile bottom
    // padding is built from. Keeps the last row scrolling clear of the
    // foot instead of dissolving into the mask-fade right where the foot
    // begins. Re-measured on resize/orientation-change and whenever the
    // foot itself changes size (e.g. webfont swap re-wrapping its lines).
    function syncFootOffset() {
      if (!footEl) return;
      var h = footEl.getBoundingClientRect().height;
      if (h) panel.style.setProperty('--menu-foot-h', Math.ceil(h) + 'px');
    }
    if (footEl && typeof window.ResizeObserver === 'function') {
      footResizeObserver = new ResizeObserver(syncFootOffset);
      footResizeObserver.observe(footEl);
    }
    window.addEventListener('resize', function () {
      if (isOpen) { syncFootOffset(); fitBody(); }
    }, { passive: true });

    function setFeature(src, kicker, caption) {
      if (featureKicker)  featureKicker.textContent = kicker || '';
      if (featureCaption) featureCaption.textContent = caption || '';
      if (!featureImg || !src) return;
      if (featureImg.getAttribute('data-current-src') === src) return;
      featureImg.setAttribute('data-current-src', src);
      featureImg.classList.remove('is-visible');

      function reveal() {
        featureImg.removeEventListener('load', reveal);
        featureImg.removeEventListener('error', reveal);
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            featureImg.classList.add('is-visible');
          });
        });
      }
      featureImg.addEventListener('load', reveal);
      featureImg.addEventListener('error', reveal);
      featureImg.setAttribute('src', src);
    }

    // Opening the panel moves focus to the first row for keyboard users, and the
    // feature panel swaps on focus as well as hover. Together those meant the
    // world-appropriate default preview was never seen: every page opened showing
    // row 01's image, so a Labs page greeted you with the Studio hero. Suppress the
    // swap for that one programmatic focus only.
    var suppressFeature = false;

    function showDefault() {
      if (!featureEl) return;
      setFeature(
        featureEl.getAttribute('data-default-preview'),
        featureEl.getAttribute('data-default-kicker'),
        featureEl.getAttribute('data-default-caption')
      );
    }

    function showRow(row) {
      activeRow = row;
      var desc = row.querySelector('.mz-menu-row-desc');
      setFeature(
        row.getAttribute('data-preview'),
        row.getAttribute('data-kicker'),
        desc ? desc.textContent : ''
      );
    }

    function clearRow(row) {
      if (activeRow !== row) return;
      activeRow = null;
      showDefault();
    }

    function preload() {
      if (preloaded) return;
      preloaded = true;
      rows.forEach(function (row) {
        var src = row.getAttribute('data-preview');
        if (!src) return;
        var img = new Image();
        img.src = src;
      });
    }

    function focusableEls() {
      return qsa('a[href],button:not([disabled])', panel);
    }

    function onKeydown(e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab' && e.keyCode !== 9) return;

      var f = focusableEls();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }

    // Scale the row list so it FILLS the sheet rather than sitting in a pool of
    // empty space. Type and spacing are all multiples of --mfs, so the natural
    // height is very close to linear in it: measure at 1, take the ratio, then
    // refine once because re-wrapping at the new size shifts the total slightly.
    var MFS_MIN = 0.80, MFS_MAX = 2.6;
    function fitBody() {
      var groups = panel.querySelector('.mz-menu-groups');
      var body = panel.querySelector('.mz-menu-body');
      if (!groups || !body) return;

      function avail() {
        var cs = getComputedStyle(body);
        return body.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      }
      // Measure the tallest COLUMN, not the groups box: the box is a stretched
      // grid item, so its height is always the track height and the ratio would
      // always come out as 1. The columns are align-items:start, so their boxes
      // are true content height.
      function natural() {
        var tallest = 0;
        for (var i = 0; i < groups.children.length; i++) {
          var hgt = groups.children[i].getBoundingClientRect().height;
          if (hgt > tallest) tallest = hgt;
        }
        return tallest;
      }

      panel.style.setProperty('--mfs', '1');
      var space = avail(), have = natural();
      if (space <= 0 || have <= 0) return;

      var k = space / have;
      for (var pass = 0; pass < 3; pass++) {
        k = Math.max(MFS_MIN, Math.min(MFS_MAX, k));
        panel.style.setProperty('--mfs', String(k.toFixed(3)));
        var now = natural();
        if (now <= space && space - now < space * 0.06) break; // filled, not overflowing
        k *= space / now;
      }
      // Never leave anything overflowing. Guard on the body's own scroll height,
      // not just the row column — the preview column can be the taller one.
      var guard = 0;
      while ((body.scrollHeight > body.clientHeight + 1 || natural() > avail())
             && k > MFS_MIN && guard++ < 20) {
        k = Math.max(MFS_MIN, k * 0.96);
        panel.style.setProperty('--mfs', String(k.toFixed(3)));
      }
    }

    function blockScroll(e) { e.preventDefault(); }

    // Space/PageUp/PageDown/Home/End/arrows scroll the document. Swallow them
    // unless the focus is in a control that legitimately uses them.
    var SCROLL_KEYS = { ' ': 1, 'Spacebar': 1, 'PageUp': 1, 'PageDown': 1,
                        'Home': 1, 'End': 1, 'ArrowUp': 1, 'ArrowDown': 1 };
    function blockScrollKeys(e) {
      if (!SCROLL_KEYS[e.key]) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      e.preventDefault();
    }

    function open() {
      if (isOpen) return;
      isOpen = true;
      lastFocused = document.activeElement;

      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      if (scrim) scrim.classList.add('is-open');
      triggers.forEach(function (t) {
        t.classList.add('is-open');
        t.setAttribute('aria-expanded', 'true');
      });

      document.documentElement.classList.add('mz-menu-lock');
      document.body.classList.add('mz-menu-lock');
      if (window.lenisInstance && typeof window.lenisInstance.stop === 'function') {
        try { window.lenisInstance.stop(); } catch (e) {}
      }
      // overflow:hidden alone does not stop a smooth-scroll library, and not every
      // page exposes its instance. Block the input itself so the view is genuinely
      // frozen — the sheet is sized to fit, so nothing inside it needs to scroll.
      document.addEventListener('wheel', blockScroll, { passive: false });
      document.addEventListener('touchmove', blockScroll, { passive: false });
      document.addEventListener('keydown', blockScrollKeys, false);

      syncFootOffset();
      fitBody();
      preload();
      showDefault();
      document.addEventListener('keydown', onKeydown, true);

      // The panel goes visibility:hidden -> visible on a CSS transition
      // (even under reduced motion, where it's just a 0-duration one) so
      // that closed content can't be tab-reached. That switch lands on the
      // next style/layout flush, not synchronously with the class add
      // above — a raw setTimeout can fire before that flush happens and
      // land on a still-hidden element, where .focus() silently no-ops.
      // Two rAFs guarantee at least one flush has occurred first.
      if (openFocusTimer) window.cancelAnimationFrame(openFocusTimer);
      openFocusTimer = window.requestAnimationFrame(function () {
        openFocusTimer = window.requestAnimationFrame(function () {
          var first = rows[0] || focusableEls()[0];
          suppressFeature = true;
          if (first) first.focus();
          window.setTimeout(function () { suppressFeature = false; }, 0);
        });
      });
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;

      if (openFocusTimer) window.cancelAnimationFrame(openFocusTimer);

      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      if (scrim) scrim.classList.remove('is-open');
      triggers.forEach(function (t) {
        t.classList.remove('is-open');
        t.setAttribute('aria-expanded', 'false');
      });

      document.documentElement.classList.remove('mz-menu-lock');
      document.body.classList.remove('mz-menu-lock');
      if (window.lenisInstance && typeof window.lenisInstance.start === 'function') {
        try { window.lenisInstance.start(); } catch (e) {}
      }
      document.removeEventListener('wheel', blockScroll, { passive: false });
      document.removeEventListener('touchmove', blockScroll, { passive: false });
      document.removeEventListener('keydown', blockScrollKeys, false);

      document.removeEventListener('keydown', onKeydown, true);
      activeRow = null;

      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    triggers.forEach(function (t) {
      t.addEventListener('click', function () {
        if (isOpen) close(); else open();
      });
    });
    closers.forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        close();
      });
    });
    rows.forEach(function (row) {
      row.addEventListener('mouseenter', function () { showRow(row); });
      row.addEventListener('mouseleave', function () { clearRow(row); });
      row.addEventListener('focus', function () { if (!suppressFeature) showRow(row); });
      row.addEventListener('blur', function () { clearRow(row); });
      row.addEventListener('click', function () { close(); }); // close on navigation
    });
    window.addEventListener('hashchange', function () { close(); });
  }

  /* ----------------------------------------------------------------------
     MZ.magnetic — [data-magnetic] elements follow the pointer within
     MAGNETIC_RADIUS and spring back on leave. Transform only. Disabled on
     coarse (touch) pointers and under reduced motion.
     ---------------------------------------------------------------------- */
  function magnetic() {
    if (prefersReducedMotion) return;

    var isCoarse = false;
    try { isCoarse = window.matchMedia('(pointer: coarse)').matches; } catch (e) {}
    if (isCoarse) return;

    var els = qsa('[data-magnetic]');
    if (!els.length) return;

    els.forEach(function (el) {
      el.style.transition = 'transform .4s ' + EASE_SPRING;
    });

    document.addEventListener('mousemove', function (e) {
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var r = el.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dx = e.clientX - cx;
        var dy = e.clientY - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= MAGNETIC_RADIUS) {
          var pull = (1 - dist / MAGNETIC_RADIUS) * 0.5;
          el.style.transition = 'transform .15s ease-out';
          el.style.transform = 'translate(' + (dx * pull).toFixed(2) + 'px,' + (dy * pull).toFixed(2) + 'px)';
          el.dataset.mzMagActive = '1';
        } else if (el.dataset.mzMagActive) {
          el.style.transition = 'transform .4s ' + EASE_SPRING;
          el.style.transform = 'translate(0,0)';
          delete el.dataset.mzMagActive;
        }
      }
    }, { passive: true });
  }

  /* ----------------------------------------------------------------------
     MZ.init — bootstraps every module. Safe to call more than once.
     ---------------------------------------------------------------------- */
  function init() {
    clocks();
    nav();
    switcher();
    arrive();
    menu();
    magnetic();
    guardCurtainOnRestore();
  }

  window.MZ = {
    clocks: clocks,
    nav: nav,
    here: here,
    switcher: switcher,
    arrive: arrive,
    menu: menu,
    magnetic: magnetic,
    init: init,
    prefersReducedMotion: prefersReducedMotion
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
