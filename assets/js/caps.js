/* ============================================================
   CAPABILITY PAGES — behaviour                        (caps.js)
   ============================================================
   Shared by capabilities/{ai,cloud,mobile,iot}.html, loaded after
   the vendor bundle (gsap + ScrollTrigger + Lenis). The shared
   site behaviours (clocks, magnetic buttons, world switch,
   crossover, menu) come from manzar-system.js / crossover.js /
   menu.js — this file only owns what is page-local:

   - Lenis smooth scroll wired to gsap's ticker (Labs recipe)
   - hero entrance + slow media settle
   - [data-cv] reveals (IO; the .cp-js gate keeps no-JS readable)
   - chapter rail active state (scroll-spy)
   - [data-plx] parallax drift
   - [data-count] counters
   - set pieces: eval terminal / status wall / device drift /
     pipeline line-draw
   - footer dither band (same Bayer technique as the main pages)
   ============================================================ */
(function caps () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('cp-js');
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if (!RM && window.Lenis && window.gsap) {
    lenis = new window.Lenis({ duration: 1.05, smoothWheel: true });
    if (window.ScrollTrigger) {
      gsap.registerPlugin(window.ScrollTrigger);
      lenis.on('scroll', window.ScrollTrigger.update);
    }
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var el = document.querySelector(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.05 });
    else el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  });

  /* ---------- reveals ---------- */
  var cvs = $$('[data-cv]');
  if ('IntersectionObserver' in window && cvs.length) {
    var io = new IntersectionObserver(function (ens) {
      ens.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('cv-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    cvs.forEach(function (el) { io.observe(el); });
  } else {
    cvs.forEach(function (el) { el.classList.add('cv-in'); });
  }

  /* ---------- hero entrance ---------- */
  if (!RM && window.gsap) {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    var crumb = $('.cp-crumb'), ht = $('.cp-hero-title'), hs = $('.cp-hero-sub'),
        hc = $('.cp-hero-ctas'), hm = $('.cp-hero-meta'), hi = $('.cp-hero-media img');
    if (hi) tl.fromTo(hi, { scale: 1.12 }, { scale: 1.0, duration: 2.2, ease: 'power2.out' }, 0);
    if (crumb) tl.from(crumb, { y: 18, opacity: 0, duration: .6 }, .15);
    if (ht) tl.from(ht, { y: 44, opacity: 0, duration: 1.0 }, .22);
    if (hs) tl.from(hs, { y: 26, opacity: 0, duration: .8 }, .42);
    if (hc) tl.from(hc, { y: 24, opacity: 0, duration: .8 }, .52);
    if (hm) tl.from(hm, { y: 24, opacity: 0, duration: .8 }, .6);
  }

  /* ---------- chapter rail scroll-spy ---------- */
  var tocLinks = $$('.cp-toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (ens) {
      ens.forEach(function (en) {
        if (!en.isIntersecting) return;
        tocLinks.forEach(function (a) { a.classList.remove('is-here'); a.removeAttribute('aria-current'); });
        var a = map[en.target.id];
        if (a) { a.classList.add('is-here'); a.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  /* ---------- parallax ---------- */
  if (!RM && window.gsap && window.ScrollTrigger) {
    $$('[data-plx]').forEach(function (img) {
      var holder = img.parentElement;
      gsap.fromTo(img, { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: holder, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------- counters ---------- */
  if (window.gsap && window.ScrollTrigger) {
    $$('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = (el.getAttribute('data-count').split('.')[1] || '').length;
      var pre = el.getAttribute('data-pre') || '';
      var unit = el.querySelector('.u') ? el.querySelector('.u').outerHTML : '';
      if (RM) return;
      var st = { v: 0 };
      window.ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () {
          gsap.to(st, { v: target, duration: 1.5, ease: 'power2.out',
            onUpdate: function () { el.innerHTML = pre + st.v.toFixed(dec) + unit; } });
        }
      });
    });
  }

  /* ---------- set piece: eval terminal ---------- */
  var term = $('#cpTerm');
  if (term) {
    var SCRIPT = [
      { h: '<span class="k">$</span> eval --suite booking-agent',                d: 420 },
      { h: '<span class="dim">prompt 014</span>  "can I move Thursday to 4pm?"', d: 620 },
      { h: 'model    <span class="dim">→</span> reschedule(id 8412, 16:00)',     d: 560 },
      { h: 'source   <span class="dim">→</span> calendar.ics <span class="dim">· cited</span>', d: 520 },
      { h: 'guard    <span class="dim">→</span> double-booking check <span class="ok">pass</span>', d: 620 },
      { h: '<span class="ok">✓ 47/47 cases</span> <span class="dim">· 0 hallucinations · 1.9s p95</span>', d: 1600 }
    ];
    var body = $('.cp-term-body', term);
    var runTerm = function () {
      body.innerHTML = '';
      var i = 0;
      (function step () {
        if (i >= SCRIPT.length) { setTimeout(runTerm, 3600); return; }
        var line = document.createElement('div');
        line.className = 'cp-term-line';
        line.innerHTML = SCRIPT[i].h + (i < SCRIPT.length - 1 ? ' <span class="cp-term-caret"></span>' : '');
        var prev = body.querySelector('.cp-term-caret');
        if (prev) prev.remove();
        body.appendChild(line);
        setTimeout(step, RM ? 0 : SCRIPT[i].d);
        i++;
      })();
    };
    if (RM) {
      body.innerHTML = SCRIPT.map(function (l) { return '<div class="cp-term-line">' + l.h + '</div>'; }).join('');
    } else if ('IntersectionObserver' in window) {
      var tio = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { runTerm(); tio.disconnect(); }
      }, { threshold: .35 });
      tio.observe(term);
    } else runTerm();
  }

  /* ---------- set piece: status wall ---------- */
  var wall = $('#cpWall');
  if (wall && !RM) {
    var rows = $$('.cp-wall-dots', wall);
    setInterval(function () {
      rows.forEach(function (r) {
        var dots = r.children;
        for (var i = 0; i < dots.length - 1; i++) dots[i].className = dots[i + 1].className;
        var last = dots[dots.length - 1];
        last.className = Math.random() < .965 ? '' : (Math.random() < .5 ? 'w' : 'a');
      });
    }, 1200);
  }

  /* ---------- set piece: device drift ---------- */
  if (!RM && window.gsap && window.ScrollTrigger) {
    var devA = $('.cp-dev-a'), devB = $('.cp-dev-b');
    if (devA && devB) {
      var dwrap = $('.cp-devices');
      gsap.to(devA, { y: -26, ease: 'none', scrollTrigger: { trigger: dwrap, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.to(devB, { y: 30, ease: 'none', scrollTrigger: { trigger: dwrap, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  }

  /* ---------- set piece: pipeline line-draw + packet ---------- */
  var pipe = $('#cpPipe');
  if (pipe && window.gsap && window.ScrollTrigger && !RM) {
    var paths = $$('path.pl, path.pa', pipe);
    paths.forEach(function (p) {
      var L = p.getTotalLength();
      p.style.strokeDasharray = L;
      p.style.strokeDashoffset = L;
      gsap.to(p, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut',
        scrollTrigger: { trigger: pipe, start: 'top 80%', once: true } });
    });
    var dot = $('.pdot', pipe), rail = $('#cpPipeRail', pipe);
    if (dot && rail && dot.ownerSVGElement) {
      var RL = rail.getTotalLength();
      var t = { v: 0 };
      gsap.to(t, { v: 1, duration: 5.4, repeat: -1, ease: 'none', delay: 1.6,
        onUpdate: function () {
          var pt = rail.getPointAtLength(t.v * RL);
          dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
        } });
    }
  }

  /* ---------- footer dither band ---------- */
  function dither (sel) {
    var cv = $(sel);
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var cell = 9, color = '#E9E6DD', speed = 0.00042;
    var B = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
    var W, H, cols, rows2;
    function resize () {
      W = cv.width = Math.max(2, cv.offsetWidth);
      H = cv.height = Math.max(2, cv.offsetHeight);
      cols = Math.ceil(W / cell); rows2 = Math.ceil(H / cell);
    }
    resize();
    requestAnimationFrame(resize);                    /* after first layout */
    window.addEventListener('resize', resize);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(cv);
    function paint (t) {
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = color;
      var tt = t * speed;
      for (var y = 0; y < rows2; y++) {
        var v = y / rows2;
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
    if (RM) { paint(1200); return; }
    var run = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { run = en[0].isIntersecting; }).observe(cv);
    }
    var last = 0;
    (function frame (t) {
      if (run && t - last > 50) { last = t; paint(t); }
      window.requestAnimationFrame(frame);
    })(0);
  }
  dither('#cv-band-cap');

  /* ---------- year ---------- */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
