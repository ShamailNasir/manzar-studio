/* ============================================================
   MANZAR · world crossover
   ------------------------------------------------------------
   Makes Studio <-> Labs feel like one site rather than two.

   Why this and not Barba: Barba swaps the DOM of the incoming page
   without running its scripts. The Studio page is a single file whose
   hero is WebGL driven by a large inline script that assumes a fresh
   document — swapped in by Barba it would arrive completely dead, and
   making it re-runnable means restructuring the one page that is
   already finished and signed off. This gets the same result — no
   white flash, no jump, one continuous motion — without touching
   either page's internals.

   How it works: the outgoing page wipes a curtain up over itself,
   then navigates. The incoming page sees the flag in sessionStorage,
   paints the curtain already covering, and wipes it away once it has
   painted. Two halves of one movement.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'mz:crossover';
  var COVER_MS = 460;
  var LIFT_MS  = 620;

  var reduce = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* the assets folder sits at the site root; Labs is one level down */
  function assetsRoot() {
    return /\/labs\//.test(location.pathname) ? '../assets/' : 'assets/';
  }

  function build(world) {
    var el = document.createElement('div');
    el.className = 'mz-cross';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="mz-cross-in">' +
        '<img class="mz-cross-logo" src="' + assetsRoot() + 'manzar-wordmark.png" alt="">' +
        '<span class="mz-cross-room">' + (world === 'labs' ? 'Labs' : 'Studio') + '</span>' +
      '</div>';
    document.body.appendChild(el);
    return el;
  }

  /* ── arriving ─────────────────────────────────────────────── */
  var incoming = null;
  try { incoming = sessionStorage.getItem(KEY); } catch (e) {}

  if (incoming) {
    try { sessionStorage.removeItem(KEY); } catch (e) {}

    var arrive = build(incoming);
    arrive.classList.add('is-covering');   // painted covering, before first paint
    document.documentElement.classList.add('mz-xover');
    /* the head-level boot shim has done its job now that the real curtain
       exists; drop it so only one cover is ever in play */
    document.documentElement.classList.remove('mz-xover-boot');
    window.__mzCrossover = true;

    /* A curtain that fails to lift leaves the visitor staring at a black
       screen, so nothing here is allowed to depend on a single mechanism.
       requestAnimationFrame does not fire in a background tab, transitions
       can be paused, and load can be slow — so the lift and the removal
       each have an unconditional timer behind them, and there is an
       absolute ceiling after which the curtain is torn out regardless of
       what state it thinks it is in. */
    var lifted = false, gone = false;

    var remove = function () {
      if (gone) return;
      gone = true;
      document.documentElement.classList.remove('mz-xover-boot');
      if (arrive && arrive.parentNode) arrive.parentNode.removeChild(arrive);
      document.documentElement.classList.remove('mz-xover');
    };

    var lift = function () {
      if (lifted) return;
      lifted = true;
      arrive.classList.add('is-lifting');
      document.documentElement.classList.remove('mz-xover');
      document.dispatchEvent(new CustomEvent('mz:crossover-reveal'));
      setTimeout(remove, LIFT_MS + 140);
    };

    if (document.readyState === 'complete') setTimeout(lift, 90);
    else window.addEventListener('load', function () { setTimeout(lift, 90); });

    setTimeout(lift, 1500);    // load never fired, or fired too late
    setTimeout(remove, 3200);  // absolute ceiling: never strand the page

    /* returning to a tab mid-transition must not leave it covered */
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { lift(); setTimeout(remove, LIFT_MS + 140); }
    });
  }

  /* ── leaving ──────────────────────────────────────────────── */
  function isWorldLink(a) {
    if (!a || !a.getAttribute) return false;
    var w = a.getAttribute('data-world');
    if (w) return w;
    return false;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-world]');
    if (!a) return;

    var world = isWorldLink(a);
    if (!world) return;

    /* already in this world, or the link opens elsewhere: let it be */
    if (a.classList.contains('is-on')) { e.preventDefault(); return; }
    if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    e.preventDefault();
    var href = a.getAttribute('href');

    try { sessionStorage.setItem(KEY, world); } catch (err) {}

    if (reduce) { location.href = href; return; }

    var leave = build(world);
    requestAnimationFrame(function () {
      leave.classList.add('is-covering');
      setTimeout(function () { location.href = href; }, COVER_MS + 40);
    });
  }, true);
})();
