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
    tl.fromTo('.hero-img, .hero-video', { scale: 1.28 }, { scale: 1.12, duration: 2.6, ease: 'expo.out' }, 0);
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
    tl.fromTo('.hero-grid i, .hero-grid .plus', { opacity: 0 }, { opacity: 1, duration: 1.8, stagger: 0.07 }, 0.8);
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
      gsap.to('.preloader-logo', { opacity: 0, y: -14, duration: 0.5, ease: 'power2.in' });
      gsap.to(pre, {
        yPercent: -100, duration: 0.95, ease: 'expo.inOut', delay: 0.28,
        onComplete: function () { pre.style.display = 'none'; ScrollTrigger.refresh(); }
      });
      gsap.delayedCall(0.55, heroIntro);
    } else {
      if (hasGSAP) gsap.killTweensOf([pre, '.preloader-logo']);
      pre.style.display = 'none';
      heroIntroOnReveal();
    }
  }

  var skipPreloader = false;
  try { skipPreloader = sessionStorage.getItem('mz-pre') === '1'; } catch (e) {}

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
    gsap.to(cnt, {
      v: 100, duration: 1.0, ease: 'power2.inOut',
      onUpdate: function () { if (preCount) preCount.textContent = String(Math.round(cnt.v)).padStart(2, '0'); },
      onComplete: hidePreloader
    });
    setTimeout(hidePreloader, 2600);
  } else {
    hidePreloader();
  }

  /* ══════════════════ scroll animations ══════════════════ */
  if (hasGSAP && !reduceMotion) {

    /* hero shell insets + content parallax out */
    gsap.to('#heroShell', {
      scale: 0.965, borderRadius: '20px',
      /* edge feather comes up with the inset, so full bleed stays crisp */
      '--feather': 1,
      ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: 0.65 }
    });
    gsap.to('#heroTitle', {
      yPercent: -42, opacity: 0.2, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: '55% bottom', scrub: 0.65 }
    });
    /* keep this under the image's scale(1.12) headroom (6% top and bottom) or the
       parallax slides past the photo and exposes flat --ink along the top edge */
    gsap.to('.hero-media', {
      yPercent: 5, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: 0.65 }
    });

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

    /* service ghosts drift + titles rise over them */
    gsap.utils.toArray('.svc').forEach(function (svc) {
      var ghost = svc.querySelector('.svc-ghost');
      var title = svc.querySelector('.svc-title');
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
          trigger: svc,
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
      ScrollTrigger.create({
        trigger: jr,
        start: 'top 74%',
        end: 'bottom 66%',
        scrub: .6,
        onUpdate: function (self) {
          var reached = self.progress * stops.length;
          jr.style.setProperty('--fill', reached.toFixed(3));
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
    var machFrame = document.getElementById('machFrame');
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
    var machTimer = null;

    function machStatus() {
      var name = machReels[machIndex].getAttribute('data-title');
      machEls.status.textContent = mach.classList.contains('is-live')
        ? 'Live · browsing ' + name
        : (mach.classList.contains('is-ready') ? 'Loaded · ' + name : 'Standby');
    }

    function machPaint(reel, i) {
      machEls.idx.innerHTML = ('0' + (i + 1)) + '<i>/</i>0' + machReels.length;
      machEls.title.textContent = reel.getAttribute('data-title');
      machEls.meta.innerHTML = reel.getAttribute('data-meta');
      machEls.line.textContent = reel.getAttribute('data-line');
      machEls.open.setAttribute('href', reel.getAttribute('data-href'));
      mach.style.setProperty('--tint', reel.getAttribute('data-tint'));
      machStatus();

      mach.classList.remove('is-ready', 'is-cold');
      clearTimeout(machTimer);
      /* A blocked embed still fires load, with the browser's error page
         inside it, so there is nothing to sniff cross-origin. Declare it
         with data-embed="false" and the reel keeps its poster. */
      if (reel.getAttribute('data-embed') === 'false') {
        machFrame.removeAttribute('src');
        mach.classList.add('is-cold');
        return;
      }
      machTimer = setTimeout(function () { mach.classList.add('is-cold'); }, 6000);
      machFrame.onload = function () {
        clearTimeout(machTimer);
        mach.classList.remove('is-cold');
        mach.classList.add('is-ready');
        machStatus();
      };
      machFrame.src = reel.getAttribute('data-src');
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

    /* boot the first reel once the machine is worth loading */
    if ('IntersectionObserver' in window) {
      var machIO = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { machIO.disconnect(); machSelect(0, false); }
      }, { rootMargin: '500px 0px' });
      machIO.observe(mach);
      new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) machRelease();
      }, { threshold: 0.15 }).observe(mach);
    } else {
      machSelect(0, false);
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
