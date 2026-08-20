/* ============================================================
   CAPABILITY PAGES — motion layer               (cap-motion.js)
   ============================================================
   Shared by capabilities/{ai,cloud,mobile,iot}.html. Loaded after
   the vendor bundle (gsap + ScrollTrigger + Lenis from
   ../labs/assets/js/vendor/). Progressive enhancement throughout:
   nothing here HIDES content in CSS — initial states are set from
   JS, so a no-JS or failed-CDN visit still reads the whole page.

   - Lenis smooth scroll, wired into gsap's ticker (same recipe as
     the Labs page, so the two feel identical under the wheel)
   - hero entrance: eyebrow -> title (clip-rise) -> sub -> CTAs ->
     media panel (scale-settle), one quiet timeline
   - [data-reveal] stays with each page's own IO reveal system
   - [data-plx] parallax drift on band/media images
   - [data-count] counters (respect suffix/decimals), fire once
   - prefers-reduced-motion: everything renders settled, no motion
   ============================================================ */
(function capMotion () {
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap) return;                       /* vendors missing: static page */
  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  var ST = window.ScrollTrigger;

  /* ---------- smooth scroll ---------- */
  if (!RM && window.Lenis) {
    var lenis = new window.Lenis({ duration: 1.05, smoothWheel: true });
    if (ST) lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    /* anchor links keep working through Lenis */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var el = document.querySelector(a.getAttribute('href'));
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -90, duration: 1.1 });
    });
  }

  /* ---------- hero entrance ---------- */
  var heroBits = [
    '.p-hero .mz-eyebrow',
    '.p-hero-sub',
    '.p-hero-ctas'
  ].map(function (s) { return document.querySelector(s); }).filter(Boolean);
  var title = document.querySelector('.p-hero-title');
  var media = document.querySelector('.cap-media');

  if (RM) {
    /* nothing to do: no initial states were applied */
  } else {
    if (title) {
      /* clip-rise: wrap the title's content once, slide it up into view */
      title.classList.add('cap-rise');
      title.innerHTML = '<span>' + title.innerHTML + '</span>';
    }
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (heroBits[0]) tl.from(heroBits[0], { y: 22, opacity: 0, duration: .7 }, .05);
    if (title) tl.from(title.firstChild, { yPercent: 112, duration: 1.0 }, .12);
    if (heroBits[1]) tl.from(heroBits[1], { y: 24, opacity: 0, duration: .8 }, .34);
    if (heroBits[2]) tl.from(heroBits[2], { y: 24, opacity: 0, duration: .8 }, .44);
    if (media) {
      tl.from(media, { opacity: 0, y: 34, duration: 1.0 }, .28);
      var mimg = media.querySelector('img');
      if (mimg) tl.fromTo(mimg, { scale: 1.22 }, { scale: 1.12, duration: 1.6, ease: 'power2.out' }, .28);
      var chip = document.querySelector('.cap-chip');
      if (chip) tl.from(chip, { opacity: 0, y: 18, duration: .7 }, .9);
    }
  }

  /* [data-reveal] belongs to each page's own IO + CSS transition system —
     cap-motion deliberately leaves it alone (double-driving it would pin
     elements at inline opacity:0 that the page's .is-in class cannot beat). */

  if (!RM && ST) {
    /* ---------- parallax ---------- */
    gsap.utils.toArray('[data-plx]').forEach(function (img) {
      var holder = img.closest('.cap-band') || img.parentElement;
      gsap.fromTo(img, { yPercent: -7 }, {
        yPercent: 7, ease: 'none',
        scrollTrigger: { trigger: holder, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* ---------- counters ---------- */
    gsap.utils.toArray('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = (el.getAttribute('data-count').split('.')[1] || '').length;
      var pre = el.getAttribute('data-pre') || '';
      var suf = el.getAttribute('data-suf') || '';
      var st = { v: 0 };
      var unitHtml = el.querySelector('.u') ? el.querySelector('.u').outerHTML : (suf ? '<span class="u">' + suf + '</span>' : '');
      ST.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () {
          gsap.to(st, {
            v: target, duration: 1.6, ease: 'power2.out',
            onUpdate: function () { el.innerHTML = pre + st.v.toFixed(dec) + unitHtml; }
          });
        }
      });
    });
  }
})();
