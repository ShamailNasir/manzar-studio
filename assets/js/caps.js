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
  var tocLinks = $$('.nav-links a[href^="#"]');
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

  /* ---------- footer band: the SAME dune shader as the main pages ----------
     Lifted verbatim from labs/assets/js/main.js (glWaveBand + its fine
     dither fallback), so the dissolve texture is identical by construction. */
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
    if (RM || still) { paint(1200); return; }
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
    if (RM) { draw(12); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { run = en[0].isIntersecting; }).observe(cv);
    }
    var hoverHost = cv.closest('section,footer') || cv.parentElement;
    hoverHost.addEventListener('mousemove', function (e) { mt = e.clientX / window.innerWidth; });
    (function fr(ms) { if (run) { mx += (mt - mx) * .05; draw(ms * .001); } requestAnimationFrame(fr); })(0);
  }

  glWaveBand('#cv-band-cap', { mode: 0, alpha: 1, baseL: .34, baseR: .60, amp: .36 });

  /* ---------- year ---------- */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
