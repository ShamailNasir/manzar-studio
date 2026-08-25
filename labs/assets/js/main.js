/* ═══════════════════════════════════════════════════════════
   MANZAR LABS — main.js · v2
   Lenis smooth scroll + GSAP ScrollTrigger/SplitText
   Masked line reveals · media parallax · cinematic intro
   Live clocks are handled by the shared MZ.clocks() (manzar-system.js,
   loaded before this file) — this file only sets the footer's © year.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var docEl = document.documentElement;
  docEl.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    gsap.defaults({ ease: 'expo.out', duration: 1.2 });
  }

  /* ── hero video: fade in when ready, drop cleanly if absent ── */
  var heroVideo = document.getElementById('heroVideo');
  if (heroVideo) {
    heroVideo.style.opacity = '0';
    heroVideo.style.transition = 'opacity 1.4s ease';
    heroVideo.addEventListener('canplay', function () { heroVideo.style.opacity = '1'; });
    heroVideo.addEventListener('error', function () { if (heroVideo) { heroVideo.remove(); heroVideo = null; } }, true);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (!heroVideo) return;
        entries.forEach(function (en) {
          if (en.isIntersecting) { var p = heroVideo.play(); if (p && p.catch) p.catch(function(){}); }
          else heroVideo.pause();
        });
      }, { threshold: 0.05 }).observe(document.getElementById('hero'));
    }
  }

  /* ── © year (live clocks come from the shared MZ.clocks()) ── */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ── smooth scroll (Lenis) ───────────────────────────── */
  var lenis = null;
  if (!reduceMotion && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, wheelMultiplier: 1, smoothWheel: true,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    // Shared code (MZ.menu's scroll lock, MZ's anchor scrolling) looks for this.
    // Without it the menu could not stop the page scrolling behind the sheet.
    window.lenisInstance = lenis;
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  function scrollToTarget(target) {
    if (lenis) { lenis.scrollTo(target, { offset: 0, duration: 1.5, easing: function (t) { return 1 - Math.pow(1 - t, 4); } }); }
    else {
      var el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  var anchors = document.querySelectorAll('a[href^="#"]');
  for (var a = 0; a < anchors.length; a++) {
    (function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href');
        if (id.length > 1 && document.querySelector(id)) {
          e.preventDefault();
          scrollToTarget(id);
        }
      });
    })(anchors[a]);
  }

  /* ── menu drawer ─────────────────────────────────────────
     Retired: the old right-side drawer (#menu / #menuScrim /
     [data-menu-link]) is gone from the page. The shared .mz-menu top
     sheet now owns #menuBtn via [data-menu-toggle] + MZ.menu() in
     manzar-system.js — nothing left to wire here. */

  /* ── split-line helper (masked line reveal, Framer-style) ── */
  function splitLines(el) {
    if (!window.SplitText) return null;
    try { return new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'st-l' }); }
    catch (e) {
      try { return new SplitText(el, { type: 'lines', linesClass: 'st-l' }); }
      catch (e2) { return null; }
    }
  }

  /* ── preloader + cinematic hero intro ────────────────── */
  var pre = document.getElementById('preloader');
  var preCount = document.getElementById('preloaderCount');
  var heroIntroPlayed = false;

  function heroIntro() {
    if (heroIntroPlayed) return;
    heroIntroPlayed = true;
    if (!hasGSAP || reduceMotion) return;
    var tl = gsap.timeline();
    /* light comes up on the whole hero */
    tl.fromTo('.hero-media', { opacity: 0.15 }, { opacity: 1, duration: 2.2, ease: 'power2.out' }, 0);
    tl.fromTo('.hero-media', { scale: 1.14 }, { scale: 1.0, duration: 2.6, ease: 'expo.out' }, 0);
    var title = document.getElementById('heroTitle');
    if (window.SplitText && title) {
      var split = new SplitText(title, { type: 'chars' });
      for (var c = 0; c < split.chars.length; c++) split.chars[c].classList.add('st-char');
      gsap.set(title, { overflow: 'hidden' });
      tl.from(split.chars, {
        yPercent: 112, rotate: 4, duration: 1.5, ease: 'expo.out', stagger: 0.05
      }, 0.1);
    }
    /* The hero's reveals are class toggles rather than tweens for the same
       reason as the rest of the page — see the reveal() comment below. */
    tl.call(function () {
      var els = document.querySelectorAll('.hero .hero-inner [data-reveal]');
      for (var i = 0; i < els.length; i++) {
        (function (el, k) {
          setTimeout(function () { el.classList.add('is-in'); }, k * 90);
        })(els[i], i);
      }
    }, null, 0.55);
  }

  /* On a crossover the intro has to play *into* the reveal, not behind it: the
     shared script holds the covered curtain until this page has settled, so a
     heroIntro() fired on arrival was most of the way through by the time anything
     was visible — you landed on a hero that had already finished moving.
     MZ.arrive() dispatches mz:crossover-reveal on the frame the lift starts.
     The timer covers reduced motion and any load where that never fires;
     heroIntro() guards itself against running twice. */
  function heroIntroOnReveal() {
    if (!window.__mzCrossover) { heroIntro(); return; }
    var fallback = setTimeout(heroIntro, 1800);
    document.addEventListener('mz:crossover-reveal', function () {
      clearTimeout(fallback);
      heroIntro();
    });
  }

  /* skipPreloader() jumps straight to the done state — no wipe, no count-up —
     used both when arriving via the Studio↔Labs crossover curtain (the
     shared curtain lift is the only thing the visitor should see) and on
     any later load this session once that has already happened once. */
  function hidePreloader(skip) {
    if (!pre || pre.classList.contains('is-done')) return;
    pre.classList.add('is-done');
    if (hasGSAP && !reduceMotion && !skip) {
      gsap.to('.preloader-core', { opacity: 0, y: -14, duration: 0.45, ease: 'power2.in' });
      gsap.to(pre, {
        yPercent: -100, duration: 0.95, ease: 'expo.inOut', delay: 0.28,
        onComplete: function () { pre.style.display = 'none'; ScrollTrigger.refresh(); }
      });
      gsap.delayedCall(0.55, heroIntro);
    } else {
      if (hasGSAP) gsap.killTweensOf([pre, '.preloader-core']);
      pre.style.display = 'none';
      heroIntroOnReveal();
    }
  }

  /* The preloader plays on every plain load and refresh — by request, the
     clean wordmark holds for a full two seconds. The only skip is a
     Studio↔Labs crossover, where the shared curtain owns the screen; the
     head snippet set window.__mzCrossover synchronously before this file
     ran, so there is no race with manzar-system.js consuming its flag. */
  var skipPreloader = window.__mzCrossover === true;

  /* live guard: manzar-system.js (loaded before this file, but as a
     deferred <head> script it can run either just before or just after
     this classic script depending on the browser) dispatches this on
     arrival from a Studio→Labs crossover. Whenever it fires, cut the
     preloader short immediately, even if its own tween already started. */
  document.addEventListener('mz:skip-preloader', function () { hidePreloader(true); });

  if (skipPreloader) {
    hidePreloader(true);
  } else if (pre && hasGSAP && !reduceMotion) {
    /* entrance is the CSS animation on .preloader-logo; JS only decides when to lift */
    var cnt = { v: 0 };
    var preRail = document.getElementById('preloaderRail');
    gsap.to(cnt, {
      v: 100, duration: 1.3, ease: 'power2.inOut',
      onUpdate: function () {
        if (preCount) preCount.textContent = String(Math.round(cnt.v)).padStart(2, '0');
        if (preRail) preRail.style.transform = 'scaleX(' + (cnt.v / 100) + ')';
      },
      /* a beat at 100 before the lift, so the finished state registers */
      onComplete: function () { gsap.delayedCall(0.2, hidePreloader); }
    });
    setTimeout(hidePreloader, 2600);
  } else {
    hidePreloader();
  }

  /* ══════════════════ scroll animations ══════════════════ */
  if (hasGSAP && !reduceMotion) {

    /* the hero stays full-bleed on scroll — the old shell inset
       (scale .965 + radius + feather) is removed by request; the
       frame never shrinks out of the viewport. */
    /* title parallax removed with the tall-hero runway (hero is 100svh now) */
    /* hero media parallax removed: the video frame stays pinned solid on
       all four edges while scrolling — no downward slide, no exposed ink. */

    /* ── generic reveals ──────────────────────────────────────────
       These used to be gsap.fromTo({y:56, opacity:0}) tweens driven by
       ScrollTrigger. That made every one of the seventy revealable
       elements on this page sit 56px BELOW its real position until a
       JavaScript animation finished moving it — and a tween only
       finishes if the ticker keeps running. Background the tab, drop a
       few frames on a heavy section, scroll faster than the tween, and
       elements freeze part-way: measured live, every element above the
       viewport was stuck at translateY(34px). Content permanently
       parked low, shifting whenever an animation resumed. That is the
       "layout adjusts itself downwards" bug, and it could not be fixed
       by retuning the animation because the layout position itself was
       the thing being animated.

       Now the offset lives in CSS and an IntersectionObserver adds one
       class. A CSS transition cannot stall: once .is-in is set the
       element WILL land at translate zero, whatever the frame rate or
       tab state. If the observer never runs at all the fallback in the
       stylesheet leaves everything visible and in place. */
    var revealables = document.querySelectorAll('main [data-reveal]:not(.hero [data-reveal])');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries, obs) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            entries[i].target.classList.add('is-in');
            obs.unobserve(entries[i].target);
          }
        }
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
      for (var r = 0; r < revealables.length; r++) io.observe(revealables[r]);

      /* Safety net. An observer only fires on an intersection *change*, so a
         hash jump, a restored scroll position or a very fast flick can carry
         an element past the viewport without it ever being seen — and it
         would then stay invisible forever. This sweep reveals anything that
         has already reached the viewport regardless. */
      var sweep = function () {
        for (var s = 0; s < revealables.length; s++) {
          var el = revealables[s];
          if (!el.classList.contains('is-in') &&
              el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add('is-in');
          }
        }
      };
      var sweepPending = false;
      window.addEventListener('scroll', function () {
        if (sweepPending) return;
        sweepPending = true;
        setTimeout(function () { sweepPending = false; sweep(); }, 220);
      }, { passive: true });
      window.addEventListener('load', sweep);
      window.addEventListener('hashchange', function () { setTimeout(sweep, 400); });
    } else {
      for (var r2 = 0; r2 < revealables.length; r2++) revealables[r2].classList.add('is-in');
    }

    /* giant headlines: masked line rise (Framer-style) */
    gsap.utils.toArray('[data-wipe-words], [data-wipe]').forEach(function (h) {
      var sp = splitLines(h);
      var targets = sp && sp.lines && sp.lines.length ? sp.lines : [h];
      gsap.fromTo(targets, { yPercent: 105, opacity: sp ? 1 : 0 }, {
        yPercent: 0, opacity: 1, duration: 1.35, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: h, start: 'top 87%', once: true }
      });
    });

    /* media parallax everywhere (the reference's signature depth) */
    gsap.utils.toArray('.work-media img, .acc-media img, .studio-fig img, .mission-fig img, .work-fallback, .acc-fallback, .studio-fallback, .mission-fig-fallback').forEach(function (im) {
      gsap.set(im, { scale: 1.10 });
      gsap.fromTo(im, { yPercent: -4.5 }, {
        yPercent: 4.5, ease: 'none',
        scrollTrigger: { trigger: im.parentNode, start: 'top bottom', end: 'bottom top', scrub: 0.65 }
      });
    });

    /* count-ups */
    gsap.utils.toArray('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 2.1, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: function () { el.textContent = String(Math.round(obj.v)) + suffix; }
      });
    });

    /* service ghosts drift + titles rise over them — including the walk's
       own section head (.lsv), which was missing from this list and was
       the one static numeral on the page */
    gsap.utils.toArray('.svc, .lsv').forEach(function (svc) {
      var ghost = svc.querySelector('.svc-ghost');
      var title = svc.querySelector('.svc-title');
      /* the walk's section is six screens tall; its numeral must ride
         the HEAD's passage, not the whole section's, or the drift is
         homeopathic. Other sections are compact, so section == window. */
      var trigEl = svc.classList.contains('lsv')
        ? (svc.querySelector('.svc-head') || svc) : svc;
      /* ── paired parallax on the header ────────────────────────
         Rebuilt as a computed curve rather than a straight A-to-B tween,
         because a linear ramp is what made the old one feel mechanical:
         it moved at exactly one speed and the section's centre — the
         moment you are actually reading it — was not marked in any way.

         Two curves now run off one progress value:

           travel   linear, and CONVERGING. The ghost and the type close
                    toward each other and meet as the section reaches the
                    middle of the screen.
           presence a triangular curve peaking at the centre. The numeral
                    swells fractionally and lifts in brightness as it
                    arrives, then recedes. That peak is what makes it feel
                    like the section arrives rather than merely passes.

         A longer scrub (1.25) carries it: the numeral trails the scroll
         noticeably, which is what reads as weight and depth on a big
         background element. It is safe to lag because nothing here
         affects layout — translate, scale and opacity only, all on an
         absolutely positioned glyph. Custom properties rather than GSAP
         transforms so CSS keeps ownership of resting position. */
      if (ghost && title) {
        var AMP_G = 150;   // the numeral's travel
        var AMP_T = 38;    // the type's counter-travel
        var ease  = function (t) { return t * t * (3 - 2 * t); };   // smoothstep

        ScrollTrigger.create({
          trigger: trigEl,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.25,
          onUpdate: function (self) {
            var p = self.progress;
            // -1 at the top of the pass, 0 at centre, +1 at the bottom
            var signed = (p - 0.5) * 2;
            // 0 at the edges, 1 dead centre, eased so the peak is soft
            var centre = ease(1 - Math.abs(signed));

            svc.style.setProperty('--pg', (signed * AMP_G).toFixed(2));
            svc.style.setProperty('--pt', (-signed * AMP_T).toFixed(2));
            svc.style.setProperty('--pgs', (1 + centre * 0.045).toFixed(4));
            svc.style.setProperty('--pgo', (0.5 + centre * 0.5).toFixed(3));
          }
        });
      }

      var sub = svc.querySelector('.svc-sub');
      if (sub && !sub.hasAttribute('data-reveal')) sub.setAttribute('data-reveal', '');
    });

    /* accordion rows entrance */
    gsap.utils.toArray('.acc-item').forEach(function (el) {
      gsap.fromTo(el, { y: 60, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1.15, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 93%', once: true },
        onComplete: function () { gsap.set(el, { clearProps: 'transform' }); }
      });
    });

    /* the journey rail: stops rise in order, then the accent fill is
       scrubbed to scroll so the path advances as the reader moves. */
    var jr = document.getElementById('jr');
    if (jr) {
      var stops = gsap.utils.toArray('#jr .jr-stop');
      gsap.fromTo(stops, { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: .1,
        scrollTrigger: { trigger: jr, start: 'top 82%', once: true },
        onComplete: function () { gsap.set(stops, { clearProps: 'transform' }); }
      });

      /* --fill defaults to "all five stops" in CSS so the rail still reads
         without JS; take it back to zero now that we can drive it. */
      jr.classList.add('is-scrubbed');
      jr.style.setProperty('--fill', '0');

      /* The clock above the rail is one continuous project clock,
         scrubbed by the same progress as the rail fill:

           WEEK 00 → 01 → 02 … 06,
           then the unit flips and the SAME moment reads DAY 42
           (week six IS day forty-two), and it rolls on 42 → 90.

         No discontinuity anywhere: the quantity is monotonic, so the
         hand-off from weeks to days is a change of unit, not a jump.
         The displayed value is eased toward the target every frame,
         so the digits roll through their values rather than skipping.
         The markup ships saying DAY 90 so the no-JS state reads
         finished, same as the rail's --fill default. */
      var clockU = document.getElementById('jrClockU');
      var clockV = document.getElementById('jrClockV');
      var clockTarget = { unit: 'Week', val: 0 };
      var clockShown = 0, clockRAF = null;

      function clockGoal(progress) {
        var t = progress * 4, seg = Math.min(Math.floor(t), 3), f = t - seg;
        if (seg < 3) {
          return { unit: 'Week', val: seg === 2 ? 2 + f * 4 : seg + f }; /* 0→1, 1→2, 2→6 */
        }
        return { unit: 'Day', val: 42 + f * 48 };                        /* 42 → 90 */
      }
      function clockPaint() {
        clockRAF = null;
        var d = clockTarget.val - clockShown;
        clockShown += Math.abs(d) < .08 ? d : d * .16;
        if (clockU.textContent !== clockTarget.unit) clockU.textContent = clockTarget.unit;
        clockV.textContent = String(Math.round(clockShown)).padStart(2, '0');
        if (Math.abs(clockTarget.val - clockShown) > .04) {
          clockRAF = requestAnimationFrame(clockPaint);
        }
      }
      function setClock(progress) {
        if (!clockU || !clockV) return;
        var g = clockGoal(progress);
        /* crossing the unit boundary carries the value across in the new
           unit's terms, so the easing never counts through a false gap */
        if (g.unit !== clockTarget.unit) clockShown = g.unit === 'Day' ? 42 : 6;
        clockTarget = g;
        if (!clockRAF) clockRAF = requestAnimationFrame(clockPaint);
      }
      clockTarget = clockGoal(0); clockShown = 0; clockPaint();

      ScrollTrigger.create({
        trigger: jr,
        start: 'top 78%',
        end: 'bottom 32%',
        scrub: 1,
        onUpdate: function (self) {
          var reached = self.progress * stops.length;
          jr.style.setProperty('--fill', reached.toFixed(3));
          setClock(self.progress);
          for (var i = 0; i < stops.length; i++) {
            stops[i].classList.toggle('is-lit', reached >= i);
          }
        }
      });
    }

    /* ── the timeline track ────────────────────────────────────
       Anchored to the whole #speed section, not to the four columns:
       measured at the columns its scroll range was 423px, a third of a
       screen, and the whole thing completed before you could see it.
       Across the section it gets about a screen and a half.

       The head element is injected here rather than living in his
       markup, so removing this block removes every trace of it. Named
       .mz-track-head, NOT .vel-head — that is his class for this
       section's header grid, and using it collapsed the header once. */
    (function velocityTrack () {
      var section = document.getElementById('speed');
      var track   = document.querySelector('.vel-track');
      if (!section || !track) return;
      var steps = Array.prototype.slice.call(track.querySelectorAll('.vel-step'));
      if (!steps.length) return;

      var head = document.createElement('span');
      head.className = 'mz-track-head';
      head.setAttribute('aria-hidden', 'true');
      track.appendChild(head);

      /* a step's distance from the rail is the track's padding plus the
         step's own padding plus the row gap, so it cannot be hard-coded.
         Measured, and re-measured when the fonts land or the window moves. */
      var syncRail = function () {
        var tTop = track.getBoundingClientRect().top;
        var sTop = steps[0].getBoundingClientRect().top;
        track.style.setProperty('--rail-offset', Math.round(sTop - tTop) + 'px');
      };
      syncRail();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncRail);
      var railRT;
      window.addEventListener('resize', function () {
        clearTimeout(railRT); railRT = setTimeout(syncRail, 160);
      });

      var apply = function (p) {
        track.style.setProperty('--vfill', p.toFixed(4));
        for (var i = 0; i < steps.length; i++) {
          var at = i / steps.length;
          steps[i].classList.toggle('is-lit', p >= at - 0.03);
        }
      };

      ScrollTrigger.create({
        trigger: section,
        start: 'top 95%',
        end: 'bottom 35%',
        scrub: 0.7,
        onUpdate:    function (self) { apply(self.progress); },
        onLeave:     function () { apply(1); },
        onLeaveBack: function () { apply(0); }
      });
    })();

    /* The pointer is no longer switched on from here. It lives in
       /assets/css/cursor.css behind a media query, because a class added
       by JavaScript disappears the moment the script is slow, throws, or
       the page comes back from the back/forward cache — which is exactly
       how the pointer kept reverting to the browser default. */

    /* ── the live Studio preview ───────────────────────────────
       Puts the real Manzar Studio inside the plate rather than a
       rebuilt likeness of it.

       Loaded lazily on purpose: Studio's hero carries a large inlined
       film, so the frame's src is only set once this section is within
       a screen of the viewport. Until then the composed hero sits
       underneath as the placeholder, and it stays as the fallback if
       the frame never loads.

       Rendered at a desktop viewport (1600 x 920) and scaled to fit, so
       it shows Studio's desktop layout rather than its mobile one. */
    (function studioPreview () {
      var screenEl = document.querySelector('.rp-screen');
      var frame    = document.querySelector('.rp-frame');
      var plate    = document.querySelector('.return-preview');
      if (!screenEl || !frame || !plate) return;

      var VW = 1600, VH = 920;
      frame.style.setProperty('--rp-vw', VW + 'px');
      frame.style.setProperty('--rp-vh', VH + 'px');

      var fit = function () {
        var w = plate.getBoundingClientRect().width;
        if (!w) return;
        frame.style.setProperty('--rp-scale', (w / VW).toFixed(5));
      };
      fit();
      var rt;
      window.addEventListener('resize', function () {
        clearTimeout(rt); rt = setTimeout(fit, 140);
      });

      var loaded = false;
      var load = function () {
        if (loaded) return;
        loaded = true;
        frame.addEventListener('load', function () {
          fit();
          // let Studio's own intro settle before revealing it
          setTimeout(function () { screenEl.classList.add('is-live'); }, 450);
        });
        frame.addEventListener('error', function () {
          /* leave the composed hero showing — it is a complete fallback */
        });
        frame.src = '../index.html';
      };

      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) { load(); io.disconnect(); }
        }, { rootMargin: '100% 0px' });
        io.observe(plate);
      } else {
        load();
      }
    })();

    /* ── the crossover stage ───────────────────────────────────
       Three planes at three rates as the section passes, plus a bloom
       that peaks when the section is centred.

         --rpy  the parallax offset. The bloom takes 0.30 of it, the
                plate the full amount, the type -0.42 of it. Those
                differing rates are the depth; a single moving layer
                would just be a moving layer.
         --rp   0 at the edges, 1 dead centre, smoothstepped. Drives the
                bloom's brightness and scale so the plate arrives out of
                light rather than sitting on a slab.

       Written on the section as custom properties, never as GSAP
       transforms — GSAP writes `translate:none` onto whatever it
       targets, which would silently kill the CSS translate the layers
       depend on. Same trap as the capability headers. */
    (function crossoverStage () {
      var sec = document.getElementById('studio-return');
      if (!sec) return;
      var smooth = function (t) { return t * t * (3 - 2 * t); };

      ScrollTrigger.create({
        trigger: sec,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.1,
        onUpdate: function (self) {
          var p = self.progress;
          var signed = (p - 0.5) * 2;                    // -1 .. +1
          var centre = smooth(1 - Math.abs(signed));     // 0 .. 1 .. 0
          sec.style.setProperty('--rpy', (signed * 62).toFixed(2));
          sec.style.setProperty('--rp',  centre.toFixed(3));
        }
      });
    })();

    /* ── cards: a spotlight on the border ──────────────────────
       Writes pointer position as a percentage onto the card. One write
       per frame, only while the pointer is over a card, and the
       handler reads no layout, so it cannot force a reflow. */
    (function pointerCards () {
      var cards = document.querySelectorAll('.ds-card, .reg-card');
      if (!cards.length || window.matchMedia('(hover: none)').matches) return;
      for (var i = 0; i < cards.length; i++) {
        (function (card) {
          var queued = false, mx = 50, my = 50;
          card.addEventListener('pointermove', function (e) {
            var r = card.getBoundingClientRect();
            mx = ((e.clientX - r.left) / r.width) * 100;
            my = ((e.clientY - r.top) / r.height) * 100;
            if (queued) return;
            queued = true;
            requestAnimationFrame(function () {
              queued = false;
              card.style.setProperty('--mx', mx.toFixed(1) + '%');
              card.style.setProperty('--my', my.toFixed(1) + '%');
            });
          }, { passive: true });
        })(cards[i]);
      }
    })();

    /* marquees with scroll-velocity boost.

       The previous version wrapped at scrollWidth/3, which assumes the markup
       repeats its phrases exactly three times. The location band repeats four
       times, so it wrapped at the wrong distance and visibly snapped back to
       zero every cycle instead of looping.

       This version does not care what the markup contains: it collapses
       whatever is there into a single measured unit, clones that unit until it
       covers more than twice the visible width, and wraps on the measured unit
       width. It also re-measures once webfonts have loaded and on resize,
       because a phrase set in a fallback face is a different width to the same
       phrase in General Sans. */
    function marquee(el, dir) {
      var speed = 55;
      var vel = 0;
      var x = 0;
      var unitW = 0;

      var unit = document.createElement('span');
      unit.className = 'mq-unit';
      while (el.firstChild) unit.appendChild(el.firstChild);
      el.appendChild(unit);

      function build() {
        // strip previous clones, keep the original unit
        while (el.children.length > 1) el.removeChild(el.lastChild);
        unitW = unit.getBoundingClientRect().width;
        if (!unitW) return false;
        var host = el.parentNode ? el.parentNode.getBoundingClientRect().width : window.innerWidth;
        var copies = Math.ceil((host * 2) / unitW) + 1;
        for (var i = 1; i < copies; i++) el.appendChild(unit.cloneNode(true));
        return true;
      }

      if (!build()) return;

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { var k = x / (unitW || 1); build(); x = k * unitW; });
      }
      var rt;
      window.addEventListener('resize', function () {
        clearTimeout(rt);
        rt = setTimeout(function () { var k = x / (unitW || 1); build(); x = k * unitW; }, 160);
      });

      if (lenis) lenis.on('scroll', function (e) { vel = e.velocity || 0; });
      gsap.ticker.add(function (t, dt) {
        if (!unitW) return;
        var boost = 1 + Math.min(Math.abs(vel) * 0.055, 2.2);
        x += dir * (speed * boost * dt) / 1000;
        // modulo rather than a single correction, so a large dt (a dropped
        // frame, or the tab returning from the background) cannot overshoot
        // past one whole unit and leave a gap
        x = ((x % unitW) + unitW) % unitW - unitW;
        gsap.set(el, { x: x });
      });
    }
    gsap.utils.toArray('[data-marquee]').forEach(function (el) { marquee(el, -1); });
    gsap.utils.toArray('[data-marquee-rev]').forEach(function (el) { marquee(el, 1); });

  } else {
    var hidden = document.querySelectorAll('[data-reveal], .svc-title, .svc-ghost');
    for (var h = 0; h < hidden.length; h++) {
      hidden[h].classList.add('is-in');
      hidden[h].style.opacity = 1;
      hidden[h].style.transform = 'none';
    }
  }

  /* ══════════════════ interactive widgets ══════════════════ */

  /* ══════════════════ the machine ══════════════════
     A belt of reels feeding one laptop. Only the loaded reel is ever a
     live document — seven iframes would be seven page loads and seven
     scroll traps. The lid angle is scrubbed to scroll, and the iframe
     stays hidden until the lid is open enough to be worth reading,
     because a document inside a rotating element renders soft.

     Taking control squares the machine to camera (rotateX 0) so the page
     inside is pixel-crisp, dims the room around it, and stops the belt.
     Touch never takes control: an embedded page you can pan has no Esc
     and no way back out, so there the reel opens in its own tab. */
  var mach = document.getElementById('mach');
  if (mach) {
    var machFramesBox = document.getElementById('machFrames');
    var machScreenEl = document.getElementById('machScreen');
    var machReels = [].slice.call(mach.querySelectorAll('.reel'));
    var machEls = {
      idx:    document.getElementById('machIdx'),
      title:  document.getElementById('machTitle'),
      meta:   document.getElementById('machMeta'),
      line:   document.getElementById('machLine'),
      open:   document.getElementById('machOpen'),
      status: document.getElementById('machStatus')
    };
    var machCan   = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    var machIndex = 0;
    var machBooted = false;

    /* ── six frames, warmed before anyone asks ──────────────────
       One iframe per project, all mounted up front. Their sources are
       set as soon as the page's own load has finished (staggered, so
       six sites do not fight Labs for bandwidth in its first seconds),
       which means changing reels later is a class flip — no network,
       no latency, no flash of poster. */
    var machFrames = [], machLoaded = [], machCold = [];
    (function buildFrames () {
      if (!machFramesBox) return;
      for (var f = 0; f < machReels.length; f++) {
        var fr = document.createElement('iframe');
        fr.className = 'mach-frame';
        fr.title = 'Live preview of ' + machReels[f].getAttribute('data-title');
        fr.setAttribute('referrerpolicy', 'no-referrer');
        fr.setAttribute('sandbox',
          'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
        machFramesBox.appendChild(fr);
        machFrames.push(fr);
        machLoaded.push(false);
        machCold.push(machReels[f].getAttribute('data-embed') === 'false');
      }
    })();

    function machWarm () {
      machFrames.forEach(function (fr, i) {
        if (machCold[i]) return;
        setTimeout(function () {
          fr.addEventListener('load', function () {
            machLoaded[i] = true;
            machCold[i] = false;
            if (i === machIndex) machReflect();
          });
          fr.src = machReels[i].getAttribute('data-src');
          /* a frame that has said nothing after 9s is declared cold —
             checked per frame, surfaced only if it is the one on stage */
          setTimeout(function () {
            if (!machLoaded[i]) { machCold[i] = true; if (i === machIndex) machReflect(); }
          }, 9000);
        }, 450 * i);
      });
    }
    if (document.readyState === 'complete') machWarm();
    else {
      var warmed = false;
      var warmOnce = function () { if (!warmed) { warmed = true; machWarm(); } };
      window.addEventListener('load', warmOnce);
      setTimeout(warmOnce, 4500);   /* belt and braces: load can be held up by video */
    }

    function machStatus() {
      var name = machReels[machIndex].getAttribute('data-title');
      machEls.status.textContent = mach.classList.contains('is-live')
        ? 'Live · browsing ' + name
        : (mach.classList.contains('is-ready') ? 'Loaded · ' + name
        : (mach.classList.contains('is-cold') ? 'Will not embed' : 'Warming up'));
    }

    /* reflect the current frame's readiness onto the machine chrome */
    function machReflect() {
      mach.classList.toggle('is-ready', !!machLoaded[machIndex] && !machCold[machIndex]);
      mach.classList.toggle('is-cold', !!machCold[machIndex]);
      machStatus();
    }

    function machPaint(reel, i) {
      machEls.idx.innerHTML = ('0' + (i + 1)) + '<i>/</i>0' + machReels.length;
      machEls.title.textContent = reel.getAttribute('data-title');
      machEls.meta.innerHTML = reel.getAttribute('data-meta');
      machEls.line.textContent = reel.getAttribute('data-line');
      machEls.open.setAttribute('href', reel.getAttribute('data-href'));
      mach.style.setProperty('--tint', reel.getAttribute('data-tint'));
      for (var f = 0; f < machFrames.length; f++) {
        machFrames[f].classList.toggle('is-front', f === i);
      }
      machReflect();
    }

    function machSelect(i, focus) {
      i = ((i % machReels.length) + machReels.length) % machReels.length;
      if (i === machIndex && machBooted) { if (focus) machReels[i].focus(); return; }
      machIndex = i;
      machRelease();

      for (var c = 0; c < machReels.length; c++) {
        var on = c === i;
        machReels[c].classList.toggle('is-on', on);
        machReels[c].setAttribute('aria-selected', on ? 'true' : 'false');
        machReels[c].tabIndex = on ? 0 : -1;
      }
      if (machScreenEl) machScreenEl.setAttribute('aria-labelledby', machReels[i].id);

      if (hasGSAP && !reduceMotion && machBooted) {
        /* the reel change reads as a load, not a crossfade: the screen
           dips to black, swaps, and comes back up */
        gsap.timeline()
          .to(machScreenEl, { opacity: .1, duration: .17, ease: 'power2.in' })
          .add(function () { machPaint(machReels[i], i); })
          .to(machScreenEl, { opacity: 1, duration: .52, ease: 'power2.out' }, '+=.05');
      } else {
        machPaint(machReels[i], i);
      }
      machBooted = true;
      if (focus) machReels[i].focus();
    }

    function machRelease() {
      if (!mach.classList.contains('is-live')) return;
      mach.classList.remove('is-live');
      machStatus();
    }
    function machEngage() {
      if (!machCan || mach.classList.contains('is-cold') || mach.classList.contains('is-live')) return;
      mach.classList.add('is-live');
      machStatus();
    }

    for (var m = 0; m < machReels.length; m++) {
      (function (reel, i) {
        reel.addEventListener('click', function () { machSelect(i, false); });
        reel.addEventListener('keydown', function (e) {
          var next = null;
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = i + 1;
          else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = i - 1;
          else if (e.key === 'Home') next = 0;
          else if (e.key === 'End') next = machReels.length - 1;
          if (next === null) return;
          e.preventDefault();
          machSelect(next, true);
        });
      })(machReels[m], m);
    }

    /* ── the screen takes the pointer on its own ──────────────────
       No click to start: resting the cursor on the glass hands scrolling
       to the page inside it. The short dwell is what stops a visitor who
       is simply scrolling past — their cursor crosses the machine at
       speed, and a page-scroll inside the window re-arms the timer
       instead of engaging. Leaving the screen hands control straight
       back, so the page is never trapped. */
    var dwell = null, lastScroll = 0, overScreen = false;
    window.addEventListener('scroll', function () {
      lastScroll = (window.performance || Date).now();
      if (!overScreen) machRelease();
    }, { passive: true });

    function machArm() {
      clearTimeout(dwell);
      dwell = setTimeout(function () {
        if (!overScreen) return;
        if ((window.performance || Date).now() - lastScroll > 240) machEngage();
        else machArm();
      }, 300);
    }
    if (machScreenEl) {
      machScreenEl.addEventListener('pointerenter', function () { overScreen = true; machArm(); });
      machScreenEl.addEventListener('pointerleave', function () {
        overScreen = false; clearTimeout(dwell); machRelease();
      });
    }

    /* ── click also takes you in ──────────────────────────────────
       Resting the cursor works, but nothing announced it, and a visitor
       who wants in should not have to discover a dwell. A click on the
       glass — or anywhere on the machine — engages immediately.

       Once engaged the iframe owns the pointer, so this listener stops
       receiving clicks and the page inside behaves normally. On touch
       there is no engaging: an embedded page you can pan has no Esc and
       no way back out, so a tap opens the real site in its own tab. */
    var machPlate = document.getElementById('plate');
    if (machPlate) {
      machPlate.addEventListener('click', function (e) {
        if (mach.classList.contains('is-live')) return;
        if (!machCan) {
          var href = machReels[machIndex].getAttribute('data-href');
          if (href) window.open(href, '_blank', 'noopener');
          return;
        }
        if (mach.classList.contains('is-cold')) return;
        e.preventDefault();
        clearTimeout(dwell);
        overScreen = true;
        machEngage();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') machRelease();
    });
    document.getElementById('machExit').addEventListener('click', function (e) {
      e.stopPropagation(); overScreen = false; clearTimeout(dwell); machRelease();
    });

    /* ── cinematic focus: pointer over the stage pulls the room dark ── */
    var machStage = mach.querySelector('.mach-stage');
    if (machStage && machCan) {
      machStage.addEventListener('pointerenter', function () { mach.classList.add('is-focus'); });
      machStage.addEventListener('pointerleave', function () { mach.classList.remove('is-focus'); });
    }

    /* frames preload on their own; the HUD boots straight away */
    machSelect(0, false);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) machRelease();
      }, { threshold: 0.15 }).observe(mach);
    }
  }

  /* accordion (02) */
  var accItems = document.querySelectorAll('#acc .acc-item');
  for (var ai = 0; ai < accItems.length; ai++) {
    (function (item) {
      var row = item.querySelector('.acc-row');
      row.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');
        for (var j = 0; j < accItems.length; j++) {
          accItems[j].classList.remove('is-open');
          accItems[j].querySelector('.acc-row').setAttribute('aria-expanded', 'false');
        }
        if (!isOpen) {
          item.classList.add('is-open');
          row.setAttribute('aria-expanded', 'true');
        }
      });
    })(accItems[ai]);
  }

  /* FAQ */
  var faqItems = document.querySelectorAll('#faqList .faq-item');
  for (var fi = 0; fi < faqItems.length; fi++) {
    (function (item) {
      var q = item.querySelector('.faq-q');
      q.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');
        for (var j = 0; j < faqItems.length; j++) {
          faqItems[j].classList.remove('is-open');
          faqItems[j].querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        }
        if (!isOpen) {
          item.classList.add('is-open');
          q.setAttribute('aria-expanded', 'true');
        }
      });
    })(faqItems[fi]);
  }

  /* contact form → mailto */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name;
      var email = form.elements.email;
      var ok = true;
      if (!name.value.trim()) { name.classList.add('is-bad'); ok = false; } else name.classList.remove('is-bad');
      if (!email.value.trim() || email.value.indexOf('@') < 1) { email.classList.add('is-bad'); ok = false; } else email.classList.remove('is-bad');
      if (!ok) return;
      var subject = 'Project inquiry — ' + name.value.trim();
      var body = 'Name: ' + name.value.trim() +
        '\nEmail: ' + email.value.trim() +
        '\nNeed: ' + form.elements.need.value +
        '\nBudget: ' + form.elements.budget.value +
        '\n\n' + form.elements.message.value;
      document.getElementById('formOk').classList.add('is-on');
      window.location.href = 'mailto:hello@manzar.solutions?subject=' +
        encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
    var inputs = form.querySelectorAll('input');
    for (var ii = 0; ii < inputs.length; ii++) {
      inputs[ii].addEventListener('input', function () { this.classList.remove('is-bad'); });
    }
  }

  /* ══════════════════ footer dither/wave band ══════════════════
     Ported from the main site's footer (index.html — search "cv-band" /
     "glWave" in its inline <script>). Same Bayer-dither 2D fallback +
     WebGL dune shader, rewritten from the source's ES2019 arrow/const
     style into this file's ES5 var/function convention. Targets a
     different canvas id (#cv-band-labs, set in the footer's band-in
     markup) so it can never collide with the main site's #cv-band —
     the two pages never share a DOM, but the id is kept distinct on
     principle. Both functions bail out immediately if their canvas
     selector doesn't resolve, and both honour reduceMotion exactly as
     the source's RM check does (still frame, no rAF loop, no listeners
     left running). */
  function ditherBand(sel, opts) {
    opts = opts || {};
    var cell = opts.cell || 9;
    var color = opts.color || '#E9E6DD';
    var speed = opts.speed || .00042;
    var still = !!opts.still;
    var cv = document.querySelector(sel);
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
    var W, H, cols, rows;
    function resize() {
      W = cv.width = Math.max(2, cv.offsetWidth);
      H = cv.height = Math.max(2, cv.offsetHeight);
      cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);
    }
    resize();
    window.addEventListener('resize', resize);
    function paint(t) {
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = color;
      var tt = t * speed;
      for (var y = 0; y < rows; y++) {
        var v = y / rows;
        for (var x = 0; x < cols; x++) {
          var u = x / cols;
          var r1 = .38 + .16 * Math.sin(u * 2.2 + tt) + .07 * Math.sin(u * 5.3 - tt * .6);
          var r2 = .68 + .12 * Math.sin(u * 1.6 - tt * .5 + 1.7) + .06 * Math.sin(u * 4.1 + tt * .8);
          var val = Math.max((v - r1) * 3.4, (v - r2) * 5) + .5;
          val = Math.max(0, Math.min(1, val));
          val = val * val * (3 - 2 * val);
          if (val > (B[y % 4][x % 4] + .5) / 16) ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }
    if (reduceMotion || still) { paint(1200); return; }
    var run = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { run = en[0].isIntersecting; }).observe(cv);
    }
    var last = 0;
    (function frame(t) { if (run && t - last > 50) { last = t; paint(t); } requestAnimationFrame(frame); })(0);
  }

  var GLU = {
    make: function (cv, alpha) {
      var gl = null;
      try {
        gl = cv.getContext('webgl', { alpha: alpha, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
      } catch (e) {}
      return gl;
    },
    prog: function (gl, fsSrc) {
      var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
      function sh(t, s) {
        var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
        if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.error('shader:', gl.getShaderInfoLog(o)); return null; }
        return o;
      }
      var v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, fsSrc);
      if (!v || !f) return null;
      var p = gl.createProgram();
      gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p); gl.useProgram(p);
      var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var a = gl.getAttribLocation(p, 'p');
      gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      return p;
    },
    NOISE: [
      'float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float nse(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}',
      'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*nse(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}'
    ].join('\n')
  };

  function glWaveBand(sel, o) {
    var cv = document.querySelector(sel);
    if (!cv) return;
    var gl = GLU.make(cv, true);
    if (!gl) { ditherBand(sel, { cell: 2, color: o.mode ? 'rgba(233,230,221,.3)' : '#E9E6DD', still: true }); return; }
    var FS = ['precision highp float;',
      'uniform vec2 R;uniform float T;uniform float M;uniform float MODE;uniform float AL;uniform float BL;uniform float BR;uniform float AMP;uniform float PX;',
      GLU.NOISE,
      'void main(){',
      ' vec2 uv=gl_FragCoord.xy/R;',
      ' float t=T*.16;',
      ' vec2 p=vec2(uv.x*2.1,uv.y*1.3);',
      ' float q=fbm(p*1.5+vec2(t*.7,t*.3));',
      ' float w=fbm(p+vec2(q*1.4+t,q*.7-t*.45));',
      ' float base=mix(BL,BR,smoothstep(0.,1.,uv.x))+(M-.5)*.07+.02*sin(T*.6+uv.x*5.);',
      ' float crest=base+(w-.5)*AMP;',
      ' float d=uv.y-crest;',
      ' float mass=1.-smoothstep(-.014,.014,d);',
      ' vec2 gp=mat2(.966,-.259,.259,.966)*gl_FragCoord.xy/PX;',
      ' vec2 cel=fract(gp)-.5;',
      ' float tw=.9+.22*sin(T*2.6+h21(floor(gp))*6.283);',
      ' float dr=clamp(.5-d*4.,0.,.5)*(1.-smoothstep(.02,.24,abs(d)))*tw;',
      ' float ht=(1.-smoothstep(max(dr-.13,0.),dr+.001,length(cel)))*step(.02,dr);',
      ' float C=clamp(max(mass,ht),0.,1.);',
      ' float gn=(h21(gl_FragCoord.xy+fract(T*1.7)*61.)-.5)*.06;',
      ' float tex=.03*(fbm(gp*.6+t)-.5);',
      ' vec3 ink=vec3(.043,.039,.031);vec3 bone=vec3(.914,.902,.867);',
      ' if(MODE<.5){gl_FragColor=vec4(mix(ink,bone,C)+gn+tex*C,1.);}',
      ' else{gl_FragColor=vec4(bone+gn,C*AL);}',
      '}'].join('\n');
    var pr = GLU.prog(gl, FS);
    if (!pr) return;
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    function U(n) { return gl.getUniformLocation(pr, n); }
    gl.uniform1f(U('MODE'), o.mode); gl.uniform1f(U('AL'), o.alpha);
    gl.uniform1f(U('BL'), o.baseL); gl.uniform1f(U('BR'), o.baseR); gl.uniform1f(U('AMP'), o.amp);
    var uR = U('R'), uT = U('T'), uM = U('M');
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cv.width = Math.max(2, cv.offsetWidth * dpr | 0);
      cv.height = Math.max(2, cv.offsetHeight * dpr | 0);
      gl.viewport(0, 0, cv.width, cv.height); gl.uniform1f(U('PX'), 6.2 * dpr);
    }
    resize();
    window.addEventListener('resize', resize);
    function draw(ms) {
      gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uT, ms); gl.uniform1f(uM, mx);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    var run = true, mx = .5, mt = .5;
    if (reduceMotion) { draw(12); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { run = en[0].isIntersecting; }).observe(cv);
    }
    var hoverHost = cv.closest('section,footer') || cv.parentElement;
    hoverHost.addEventListener('mousemove', function (e) { mt = e.clientX / window.innerWidth; });
    (function fr(ms) { if (run) { mx += (mt - mx) * .05; draw(ms * .001); } requestAnimationFrame(fr); })(0);
  }

  glWaveBand('#cv-band-labs', { mode: 0, alpha: 1, baseL: .34, baseR: .60, amp: .36 });

})();




/* ============================================================
   The Studio-shell menu controller that used to live here has been
   removed. The panel is back to his .mz-menu architecture, so
   MZ.menu() in manzar-system.js binds to it again and we get his
   focus trap, scroll lock, feature-preview swapping and the --mfs
   auto-fit for free. The header keeps our design; only the panel's
   behaviour is his.

   In-page anchor smoothing is already handled by the global
   a[href^="#"] handler further up this file.
   ============================================================ */


/* ============================================================
   SERVICES CAROUSEL — infinite
   ============================================================
   The first version advanced with a modulo, so going from the last card
   to the first slid the whole track backwards across five widths. That
   is a rewind, not a loop, and it is why it did not read as a carousel.

   This clones the set either side of the real one and always steps in
   the direction you asked for. When a step lands in a clone, the track
   is silently rebased onto the matching real card with the transition
   switched off for one frame — so the motion never reverses and there is
   no seam to see. Same trick a marquee uses, applied to a stepped track.

   Controls are dots only, as on the reference. A running counter is a
   detail nobody needs and it made the section look like a slideshow.
   ============================================================ */
(function services() {
  var stage = document.querySelector('[data-lsv]');
  if (!stage) return;
  var track = stage.querySelector('[data-lsv-track]');
  var dots  = [].slice.call(stage.querySelectorAll('.lsv-dot'));
  var prev  = stage.querySelector('[data-step="-1"]');
  var next  = stage.querySelector('[data-step="1"]');
  var real  = [].slice.call(track.children);
  var N     = real.length;
  if (!track || N < 2) return;

  /* One clone set either side, so there is always a card to move onto.
     Built with fragments: inserting one at a time in a forward loop
     reverses the leading set, which put two copies of the same card
     next to each other at the seam. */
  function cloneSet() {
    var f = document.createDocumentFragment();
    real.forEach(function (c) {
      var k = c.cloneNode(true);
      k.setAttribute('data-clone', '1');
      k.removeAttribute('id');
      f.appendChild(k);
    });
    return f;
  }
  track.insertBefore(cloneSet(), track.firstChild);
  track.appendChild(cloneSet());

  var cards = [].slice.call(track.children);
  var i = N;                       /* start on the first real card */
  var timer = null, surrendered = false, animating = false;
  var DWELL = 4600;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function place(withMotion) {
    track.style.transition = withMotion ? '' : 'none';
    track.style.setProperty('--i', i);
    if (!withMotion) { void track.offsetWidth; track.style.transition = ''; }
    var liveIndex = ((i - N) % N + N) % N;
    for (var c = 0; c < cards.length; c++) {
      var on = c === i;
      cards[c].classList.toggle('is-on', on);
      cards[c].setAttribute('aria-hidden', on ? 'false' : 'true');
      var f = cards[c].querySelectorAll('a, button');
      for (var k = 0; k < f.length; k++) f[k].tabIndex = on ? 0 : -1;
    }
    for (var d = 0; d < dots.length; d++) {
      dots[d].classList.toggle('is-on', d === liveIndex);
      dots[d].setAttribute('aria-selected', d === liveIndex ? 'true' : 'false');
    }
  }

  /* When the slide has finished, if we are standing on a clone, hop to
     the identical real card with motion off. Nothing visible changes.

     This must NOT be driven by transitionend alone. That event does not
     fire in a background tab, under reduced-motion, or when a transition
     is interrupted — and the first build gated the next step on it, so a
     single missed event left `animating` true and the carousel frozen
     for good. A timer is the authority; the event is only an early exit. */
  var SLIDE = 720, settleTimer = null;

  function settle() {
    if (settleTimer) { clearTimeout(settleTimer); settleTimer = null; }
    animating = false;
    if (i < N)           { i += N; place(false); }
    else if (i >= N * 2) { i -= N; place(false); }
  }
  track.addEventListener('transitionend', function (e) {
    if (e.propertyName === 'transform') settle();
  });

  function commit(byHand) {
    if (byHand) surrender();
    animating = true;
    place(true);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, SLIDE + 120);
  }
  function step(dir, byHand) {
    if (animating) return;
    i += dir;
    commit(byHand);
  }
  function goTo(liveIndex, byHand) {
    if (animating) return;
    var target = N + liveIndex;
    if (target === i) return;
    i = target;
    commit(byHand);
  }

  /* Autoplay runs only when the section is actually on screen, the tab is
     actually in front, and the visitor hasn't taken hold of it. Those are
     three separate conditions, so they are three separate flags checked in
     one place rather than start() being called from three handlers that
     each know only their own half of the picture. */
  var inView = false, byPointer = false;

  function sync() {
    var should = inView && !surrendered && !reduce && !document.hidden && !byPointer;
    if (should && !timer) timer = setInterval(function(){ step(1); }, DWELL);
    if (!should) stop();
  }
  function start() { inView = true;  sync(); }
  function stop()  { clearInterval(timer); timer = null; }
  function surrender() { surrendered = true; stop(); }

  if (prev) prev.addEventListener('click', function(){ step(-1, true); });
  if (next) next.addEventListener('click', function(){ step(1, true); });
  dots.forEach(function (d) {
    d.addEventListener('click', function(){ goTo(+d.getAttribute('data-go'), true); });
  });

  stage.addEventListener('pointerenter', function(){ byPointer = true;  sync(); });
  stage.addEventListener('pointerleave', function(){ byPointer = false; sync(); });
  stage.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); step(-1, true); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1, true); }
  });

  /* ── drag ──────────────────────────────────────────────────
     A rail you can take hold of is most of why the reference feels
     better than two arrows. While dragging, the track follows the
     pointer 1:1 with the transition suspended; on release it snaps to
     whichever card ended up nearest the centre, so a small drag settles
     back and a decisive one moves on. */
  var dragging = false, startX = 0, startI = 0, moved = 0;

  function cardStride() {
    var cs = getComputedStyle(track);
    var card = parseFloat(cs.getPropertyValue('--card')) || cards[0].getBoundingClientRect().width;
    var gap  = parseFloat(cs.columnGap || cs.gap) || 0;
    return card + gap;
  }

  stage.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.lsv-arrow, .lsv-dot')) return;
    dragging = true; moved = 0;
    startX = e.clientX; startI = i;
    stage.classList.add('is-dragging');
    stop();
    if (stage.setPointerCapture) { try { stage.setPointerCapture(e.pointerId); } catch (err) {} }
  });

  stage.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    moved = e.clientX - startX;
    /* fractional index: the track follows the finger exactly */
    track.style.setProperty('--i', startI - moved / cardStride());
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');
    var stride = cardStride();
    /* a flick of a third of a card is enough to commit to the next one */
    var shift = Math.abs(moved) > stride * 0.33
      ? (moved < 0 ? Math.ceil(moved / stride * -1) : -Math.ceil(moved / stride))
      : 0;
    i = startI + shift;
    if (Math.abs(moved) > 6) surrender();
    commit(false);
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('pointerleave', function () { if (dragging) endDrag(); });

  /* a drag that crossed any real distance must not also fire a click */
  stage.addEventListener('click', function (e) {
    if (Math.abs(moved) > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; }
  }, true);

  document.addEventListener('visibilitychange', sync);

  /* IntersectionObserver is the right instrument, but it is not guaranteed
     to have reported by the time the page settles — it is suspended while
     the tab is in the background, and its first callback can be deferred.
     If nothing has been heard from it shortly after load, read the rect
     once so the carousel is never left waiting on an event that already
     came and went. */
  var ioSpoke = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      ioSpoke = true; inView = en[0].isIntersecting; sync();
    }, { threshold: 0.25 }).observe(stage);
    setTimeout(function () {
      if (ioSpoke) return;
      var b = stage.getBoundingClientRect();
      inView = b.bottom > 0 && b.top < (window.innerHeight || 0);
      sync();
    }, 1600);
  } else { inView = true; sync(); }

  place(false);
})();

/* ══════════════════════════════════════════════════════════════
   THE BILLING ASSISTANT, PLAYING ITSELF
   ══════════════════════════════════════════════════════════════
   The transcript in #svc-ai is a live simulation: the question types
   into the composer, the assistant thinks, runs a visible retrieval
   over the ledger, answers with its source, and then a refund is held
   at the policy gate until a named person approves it. Then it loops.

   Three rules learned the hard way elsewhere on this page:
   - nothing advances on transitionend or rAF alone — a paced clock
     owns the sequence;
   - the clock only counts while the tab is visible AND the panel is on
     screen, so the loop never plays to an empty room and never comes
     back from a background tab mid-thought;
   - reduced motion, or no JS, keeps the static transcript that ships
     in the markup. The simulation replaces it only when it can run.
   ══════════════════════════════════════════════════════════════ */
(function aiSim () {
  var thread  = document.getElementById('aiThread');
  var field   = document.getElementById('aiComposeField');
  var chat    = thread && thread.closest('.ai-chat');
  if (!thread || !field || !chat) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var send = chat.querySelector('.ai-compose-send');

  /* ── the paced clock ─────────────────────────────────────── */
  var inView = false, ioSpoke = false;
  function rectInView () {
    var b = chat.getBoundingClientRect();
    return b.bottom > 0 && b.top < (window.innerHeight || 0);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { ioSpoke = true; inView = en[0].isIntersecting; },
                             { threshold: 0.3 }).observe(chat);
    /* IO can stay silent (backgrounded tab, deferred first callback);
       until it has spoken once, fall back to the rect on scroll */
    setTimeout(function () { if (!ioSpoke) inView = rectInView(); }, 1800);
    window.addEventListener('scroll', function () {
      if (!ioSpoke) inView = rectInView();
    }, { passive: true });
  } else {
    inView = true;
  }

  function wait (ms) {
    return new Promise(function (res) {
      var left = ms, last = (window.performance || Date).now();
      var iv = setInterval(function () {
        var now = (window.performance || Date).now();
        var dt = Math.min(now - last, 1500);   /* a long throttled gap is not replayed */
        last = now;
        if (document.hidden || !inView) return;   /* the clock holds */
        left -= dt;
        if (left <= 0) { clearInterval(iv); res(); }
      }, 90);
    });
  }

  /* ── node builders ───────────────────────────────────────── */
  function el (tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function settle (n) {
    thread.appendChild(n);
    thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
    return n;
  }
  function bubbleIn (text, time) {
    return settle(el('p', 'ai-msg ai-msg--in is-new',
      text + '<time>' + time + '</time>'));
  }
  function bubbleOut (html, cite, time, gate) {
    var cls = 'ai-msg ai-msg--out is-new' + (gate ? ' ai-msg--gate' : '');
    var body = (gate ? '<span class="ai-gate-tag">Held for approval</span>' : '') + html +
      (cite ? '<span class="ai-cite">' + cite + '</span>' : '') +
      '<time>' + time + '</time>';
    return settle(el('p', cls, body));
  }
  function think () {
    return settle(el('span', 'ai-think is-new', '<i></i><i></i><i></i>'));
  }
  var TOOL_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">' +
    '<circle cx="7" cy="7" r="4.2"/><path d="m10.4 10.4 3 3"/></svg>';
  function tool (title) {
    var n = el('div', 'ai-tool is-new is-live',
      '<div class="ai-tool-head">' + TOOL_ICON + title + '</div>');
    return settle(n);
  }
  function toolLine (t, left, right) {
    var line = el('div', 'ai-tool-line', '<b>' + left + '</b><span class="ok">' + right + '</span>');
    t.appendChild(line);
    thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
    void line.offsetWidth;
    line.classList.add('is-in');
    return line;
  }

  /* ── the composer types the question ─────────────────────────
     Cadence modelled on a person rather than a metronome: quick runs
     inside a word, a beat at each space, a longer one after
     punctuation, and the occasional hesitation mid-word. */
  function keystrokeDelay (ch, prev) {
    var d = 34 + Math.random() * 40;              /* base run */
    if (prev === ' ') d += 40 + Math.random() * 55;
    if (prev === ',' || prev === '.' || prev === '?') d += 140 + Math.random() * 120;
    if (Math.random() < 0.055) d += 160 + Math.random() * 220;  /* a thought */
    return d;
  }
  async function type (text) {
    field.classList.add('is-typing');
    var span  = el('span', 'ai-compose-text', '');
    var caret = el('span', 'ai-caret', '');
    field.appendChild(span); field.appendChild(caret);
    for (var i = 0; i < text.length; i++) {
      span.textContent = text.slice(0, i + 1);
      await wait(keystrokeDelay(text[i], text[i - 1] || ''));
    }
    await wait(340);
    if (send) { send.classList.add('is-press'); }
    await wait(140);
    if (send) { send.classList.remove('is-press'); }
    span.remove(); caret.remove();
    field.classList.remove('is-typing');
  }

  /* ── the pointer that approves ───────────────────────────────
     A drawn cursor enters the panel, travels to the Approve button,
     and presses it. Positions are computed against the panel each
     move, so it survives any resize between loops. */
  var cur = null;
  function cursorEl () {
    if (cur) return cur;
    cur = el('span', 'ai-cursor',
      '<svg class="ai-cur-arrow" viewBox="0 0 20 20" width="20" height="20"><path d="M3 1.8 16.4 9.4l-6 1.5-3 5.6z" fill="#E9E6DD" stroke="#0B0A08" stroke-width="1.1" stroke-linejoin="round"/></svg>' +
      '<svg class="ai-cur-hand" viewBox="0 0 16 16" width="21" height="21"><path d="M5.5 8.6V3.4a1.4 1.4 0 0 1 2.8 0v3.2l3.6.9a1.8 1.8 0 0 1 1.3 2.2l-.7 2.6a2 2 0 0 1-1.9 1.5H8.2a2 2 0 0 1-1.5-.7L3.6 9.9a1.3 1.3 0 0 1 1.9-1.8Z" fill="#E9E6DD" stroke="#0B0A08" stroke-width=".9" stroke-linejoin="round"/></svg>');
    chat.appendChild(cur);
    return cur;
  }
  function cursorTo (target, dx, dy) {
    var c = cursorEl();
    var cb = chat.getBoundingClientRect();
    var tb = target.getBoundingClientRect();
    var x = tb.left - cb.left + (dx == null ? tb.width * .62 : dx);
    var y = tb.top - cb.top + (dy == null ? tb.height * .58 : dy);
    c.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)';
    return c;
  }

  /* ── one full take ───────────────────────────────────────── */
  /* fade the thread out, empty it while it is invisible, fade the
     empty window back in. The old build removed the fade class before
     clearing, so a frame of stale transcript flashed at full opacity
     on every loop. */
  async function clearThread () {
    thread.classList.add('is-clearing');
    await wait(500);
    thread.innerHTML = '';
    thread.scrollTop = 0;
    thread.classList.remove('is-clearing');
    await wait(380);
  }

  async function take () {
    await wait(650);
    await type('Where is invoice 4471?');
    bubbleIn('Where is invoice 4471?', '09:24');

    await wait(500);
    var th1 = think();
    await wait(950);
    th1.remove();

    var t1 = tool('Searching your records');
    await wait(520);  toolLine(t1, 'billing_ledger', '1 match &middot; INV-4471');
    await wait(480);  toolLine(t1, 'payments_api', 'status &middot; cleared');
    await wait(430);  toolLine(t1, 'docs/invoice_4471.pdf', 'retrieved');
    await wait(500);
    t1.classList.remove('is-live');

    await wait(350);
    bubbleOut('Cleared 12 March: <b>$8,240</b> by ACH, reference 9F2C.',
              'billing_ledger &middot; payments_api', '09:24');

    await wait(2100);
    await type('Refund it.');
    bubbleIn('Refund it.', '09:25');

    await wait(500);
    var th2 = think();
    await wait(800);
    th2.remove();

    var t2 = tool('Checking policy');
    await wait(520);  toolLine(t2, 'refund_limit_v3', 'limit &middot; $5,000');
    await wait(480);  toolLine(t2, 'amount', '$8,240 &middot; over limit');
    await wait(520);
    t2.classList.remove('is-live');

    await wait(400);
    var gate = bubbleOut(
      'That is over your $5,000 limit, so I have not sent it. Queued for approval with the invoice attached.',
      'policy &middot; refund_limit_v3', '09:25', true);
    var appr = el('span', 'ai-approve is-pending',
      '<span class="ai-approve-face">S</span>' +
      '<span class="ai-approve-who"><b>Sara Malik</b><span>Finance &middot; approver</span></span>' +
      '<span class="ai-approve-actions">' +
        '<button class="ai-btn ai-btn--deny" type="button" tabindex="-1" aria-hidden="true">Deny</button>' +
        '<button class="ai-btn ai-btn--ok" type="button" tabindex="-1" aria-hidden="true">Approve</button>' +
      '</span>');
    gate.insertBefore(appr, gate.querySelector('time'));
    thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });

    /* Sara takes the mouse: born at the panel's centre, glide to
       Approve, become the pointing hand over it, click, vanish */
    await wait(1300);
    var okBtn = appr.querySelector('.ai-btn--ok');
    var cb = chat.getBoundingClientRect();
    var c = cursorTo(chat, cb.width * .5, cb.height * .52);
    c.classList.remove('is-gone', 'is-hand');
    void c.offsetWidth;
    c.classList.add('is-in');
    await wait(380);
    cursorTo(okBtn);
    /* the hand flips DURING the approach, so by the time the glide
       settles over the button it is already the clickable pointer -
       no beat of the dart resting on a button */
    await wait(520);
    c.classList.add('is-hand');
    await wait(280);
    okBtn.classList.add('is-hover');
    await wait(260);
    c.classList.add('is-press');
    okBtn.classList.add('is-press');
    await wait(140);
    c.classList.remove('is-press');
    okBtn.classList.remove('is-press');
    /* the click registers... */
    appr.classList.remove('is-pending');
    appr.classList.add('is-ok');
    appr.querySelector('.ai-approve-actions').outerHTML =
      '<span class="ai-approve-state">' +
      '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8.5 3.2 3.2L13 5"/></svg>' +
      'Approved &middot; 09:31</span>';
    /* ...and the hand is gone within the same beat */
    await wait(90);
    c.classList.add('is-gone');
    c.classList.remove('is-in', 'is-hand');

    await wait(800);
    bubbleOut('Approved by Sara. Refund of <b>$8,240</b> is on its way back to the card on file, reference R-2209.',
              'payments_api &middot; refunds', '09:31');

    /* hold the finished exchange, then hand over cleanly */
    await wait(5200);
    await clearThread();
  }

  (async function run () {
    /* the static no-JS transcript leaves the same way every loop ends:
       through the fade, never a hard swap */
    await wait(900);
    await clearThread();
    for (;;) { await take(); }
  })();
})();

/* ══════════════════════════════════════════════════════════════
   WHAT WE BUILD — THE GALLERY WALK (sticky edition)
   ══════════════════════════════════════════════════════════════
   The pin is CSS position:sticky; this script only sets the section's
   height (one viewport of stay + 92svh of travel per doorway), reads
   scroll into a target progress, and eases a transform toward it every
   frame. No ScrollTrigger pin — the pin spacer was throwing off the
   measured start of every trigger below this section on refresh, which
   is what froze the section-header parallax further down the page.

   The damping is frame-rate independent (exponential), so the walk
   feels the same at 60 and 144Hz. Touch, small screens, reduced motion
   and no-GSAP all get .wb--flat before anything is measured.
   ══════════════════════════════════════════════════════════════ */
(function wbWalk () {
  var wb = document.getElementById('wb');
  if (!wb) return;
  var track  = document.getElementById('wbTrack');
  var idxEl  = document.getElementById('wbIdx');
  var fill   = document.getElementById('wbFill');
  var panels = [].slice.call(track.children);
  var n = panels.length;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide   = window.matchMedia('(min-width: 901px)').matches;
  var fine   = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (!window.gsap || reduce || !wide || !fine) {
    wb.classList.add('wb--flat');
    for (var i = 0; i < n; i++) panels[i].classList.add('is-on');
    return;
  }

  var figs   = panels.map(function (p) { return p.querySelector('.wb-fig'); });
  var ghosts = panels.map(function (p) { return p.querySelector('.wb-ghost'); });
  var cur = -1, target = 0, current = 0, travel = 1, span = 1;

  function setActive (i) {
    if (i === cur) return;
    cur = i;
    if (idxEl) idxEl.textContent = String(i + 1).padStart(2, '0');
    for (var k = 0; k < n; k++) panels[k].classList.toggle('is-on', k === i);
  }

  function measure () {
    var vh = window.innerHeight;
    /* travel walks the doorways; the tail is a hold — the last spread
       stays on stage for almost two more screens of scroll before the
       page moves on, so arriving at 05 does not immediately dump you
       out of the section. */
    travel = Math.round((n - 1) * vh * 0.92);
    var tail = Math.round(vh * 0.55);
    wb.style.height = (vh + travel + tail) + 'px';
    span   = track.scrollWidth - window.innerWidth;
    readScroll();
  }
  /* progress is read off the section's own live rect rather than a
     cached document offset: anything above this section can change
     height at any time (video posters, fonts, a window resize mid-
     reflow), and a stale top froze the whole walk once. The rect can
     never be stale. */
  function readScroll () {
    var p = -wb.getBoundingClientRect().top / (travel || 1);
    target = Math.min(1, Math.max(0, p));
  }

  function paint (p) {
    track.style.transform = 'translate3d(' + (-p * span).toFixed(1) + 'px,0,0)';
    if (fill) fill.style.transform = 'scaleX(' + p + ')';
    setActive(Math.round(p * (n - 1)));
    for (var k = 0; k < n; k++) {
      var off = k - p * (n - 1);            /* 0 when panel k is centred */
      figs[k].style.transform   = 'translateX(' + (off * 30).toFixed(1) + 'px)';
      ghosts[k].style.transform = 'translateX(' + (off * 26).toFixed(1) + 'px)';
    }
  }

  var settled = false;
  gsap.ticker.add(function (t, dt) {
    var d = target - current;
    if (Math.abs(d) < 0.00045) {
      if (!settled) { current = target; paint(current); settled = true; }
      return;
    }
    settled = false;
    /* exponential approach: same feel at any frame rate. Tight, because
       the snap glide already carries the easing - two soft easings
       stacked read as rubber-banding. */
    current += d * (1 - Math.pow(0.0004, dt / 1000));
    paint(current);
  });

  /* ── the hook ──────────────────────────────────────────────
     Stopping between doorways leaves two half-spreads on stage, so
     when scrolling goes quiet the walk commits: past thirty percent
     into the next room (in your direction of travel) it carries you
     forward; short of that it settles back. Lenis drives the glide
     when it is present, so the snap has the same feel as the scroll. */
  var snapTimer = null, lastY = window.pageYOffset, lastDir = 0;

  function trySnap () {
    if (target <= 0.0005 || target >= 0.9995) return;
    var f = target * (n - 1), i = Math.floor(f), frac = f - i, goal;
    if (lastDir > 0)      goal = frac > 0.3 ? i + 1 : i;
    else if (lastDir < 0) goal = frac < 0.7 ? i : i + 1;
    else                  goal = Math.round(f);
    goal = Math.max(0, Math.min(n - 1, goal));
    var y = Math.round(window.pageYOffset + wb.getBoundingClientRect().top +
                       (goal / (n - 1)) * travel);
    if (Math.abs(y - window.pageYOffset) < 6) return;
    var l = window.lenisInstance || window.lenis;
    if (l && typeof l.scrollTo === 'function') {
      l.scrollTo(y, { duration: .55, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    } else {
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  window.addEventListener('scroll', function () {
    var y = window.pageYOffset;
    if (y !== lastY) lastDir = y > lastY ? 1 : -1;
    lastY = y;
    readScroll();
    clearTimeout(snapTimer);
    snapTimer = setTimeout(trySnap, 110);
  }, { passive: true });
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt); rt = setTimeout(measure, 140);
  });
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  setTimeout(measure, 1400);

  measure();
  current = target;
  paint(current);
})();
