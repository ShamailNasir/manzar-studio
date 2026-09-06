/* ══════════════════════════════════════════════════════════════════════
   MANZAR STUDIO — chrome for sub-pages
   ══════════════════════════════════════════════════════════════════════
   The four small behaviours that make a Studio page feel like the
   homepage, without dragging the homepage's 900-line motion system (and
   its WebGL hero) onto a page that has no hero:

     · the film grain over everything
     · the two city clocks in the footer
     · the magnetic pull on .magnetic controls, in plain CSS transforms
       rather than GSAP, so this file has no dependencies
     · the living wave in the footer band — the homepage's WebGL shader
       and its Bayer fallback, both ported verbatim, so the footer here
       is the same footer

   index.html does all of this itself and must NOT load this file; it is
   for /work.html and anything that follows it.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };
  var RM = false, TOUCH = false;
  try { RM = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  try { TOUCH = matchMedia('(pointer: coarse)').matches; } catch (e) {}

  /* ---------- clocks ---------- */
  function fmt(tz) {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(new Date());
  }
  function tick() {
    var lhe = fmt('Asia/Karachi'), par = fmt('Europe/Paris');
    [['#clkLhe', lhe], ['#fClkLhe', lhe], ['#clkPar', par], ['#fClkPar', par]]
      .forEach(function (p) { var e = $(p[0]); if (e) e.textContent = p[1]; });
  }
  if ($('#fClkLhe') || $('#clkLhe')) { tick(); setInterval(tick, 1000); }

  /* ---------- grain ---------- */
  (function grain() {
    var cv = $('#cv-grain');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    if (!ctx) return;
    var scale = 4, w = 0, h = 0;
    function resize() {
      w = cv.width = Math.max(2, Math.ceil(innerWidth / scale));
      h = cv.height = Math.max(2, Math.ceil(innerHeight / scale));
    }
    function noise() {
      if (!w || !h) return;
      var d = ctx.createImageData(w, h), a = d.data, i;
      for (i = 0; i < a.length; i += 4) {
        a[i] = a[i + 1] = a[i + 2] = Math.random() * 255 | 0;
        a[i + 3] = 34;
      }
      ctx.putImageData(d, 0, 0);
    }
    resize();
    addEventListener('resize', resize);
    cv.style.width = '100vw';
    cv.style.height = '100vh';
    if (RM) { noise(); return; }
    var last = 0;
    (function frame(t) {
      if (t - last > 115) { last = t; noise(); }
      requestAnimationFrame(frame);
    })(0);
  })();

  /* ---------- magnetic ---------- */
  if (!TOUCH && !RM) {
    $$('.magnetic').forEach(function (el) {
      var raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
      function loop() {
        cx += (tx - cx) * .18; cy += (ty - cy) * .18;
        el.style.transform = 'translate(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px)';
        if (Math.abs(tx - cx) > .1 || Math.abs(ty - cy) > .1) raf = requestAnimationFrame(loop);
        else { el.style.transform = 'translate(' + tx + 'px,' + ty + 'px)'; raf = 0; }
      }
      function kick() { if (!raf) raf = requestAnimationFrame(loop); }
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        tx = (e.clientX - r.left - r.width / 2) * .28;
        ty = (e.clientY - r.top - r.height / 2) * .34;
        kick();
      });
      el.addEventListener('mouseleave', function () { tx = 0; ty = 0; kick(); });
    });
  }

  /* ---------- footer band ----------
     The same living wave the homepage runs, ported verbatim: a fbm
     surface with a dot-screen crest, in WebGL. The Bayer dither below it
     is only the no-WebGL fallback — and it is the homepage's own
     fallback, at cell 2 and still, not a chunky animated checkerboard.
     Nothing else on the page owns a canvas, so this is self-contained. */
  var GLU = {
    make: function (cv, alpha) {
      var gl = null;
      try { gl = cv.getContext("webgl", { alpha: alpha, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true }); } catch (e) {}
      return gl;
    },
    prog: function (gl, fsSrc) {
      var VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
      var sh = function (t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
        if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.error("shader:", gl.getShaderInfoLog(o)); return null; } return o; };
      var v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, fsSrc);
      if (!v || !f) return null;
      var p = gl.createProgram();
      gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p); gl.useProgram(p);
      var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var a = gl.getAttribLocation(p, "p");
      gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      return p;
    },
    NOISE: [
      "float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
      "float nse(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}",
      "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*nse(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}"
    ].join("\n")
  };

  function glWave(sel, o) {
    var cv = $(sel); if (!cv) return;
    var gl = GLU.make(cv, true);
    if (!gl) { dither(sel, { cell: 2, color: o.mode ? "rgba(233,230,221,.3)" : "#E9E6DD", still: true }); return; }
    var FS = ["precision highp float;",
      "uniform vec2 R;uniform float T;uniform float M;uniform float MODE;uniform float AL;uniform float BL;uniform float BR;uniform float AMP;uniform float PX;",
      GLU.NOISE,
      "void main(){",
      " vec2 uv=gl_FragCoord.xy/R;",
      " float t=T*.16;",
      " vec2 p=vec2(uv.x*2.1,uv.y*1.3);",
      " float q=fbm(p*1.5+vec2(t*.7,t*.3));",
      " float w=fbm(p+vec2(q*1.4+t,q*.7-t*.45));",
      " float base=mix(BL,BR,smoothstep(0.,1.,uv.x))+(M-.5)*.07+.02*sin(T*.6+uv.x*5.);",
      " float crest=base+(w-.5)*AMP;",
      " float d=uv.y-crest;",
      " float mass=1.-smoothstep(-.014,.014,d);",
      " vec2 gp=mat2(.966,-.259,.259,.966)*gl_FragCoord.xy/PX;",
      " vec2 cel=fract(gp)-.5;",
      " float tw=.9+.22*sin(T*2.6+h21(floor(gp))*6.283);",
      " float dr=clamp(.5-d*4.,0.,.5)*(1.-smoothstep(.02,.24,abs(d)))*tw;",
      " float ht=(1.-smoothstep(max(dr-.13,0.),dr+.001,length(cel)))*step(.02,dr);",
      " float C=clamp(max(mass,ht),0.,1.);",
      " float gn=(h21(gl_FragCoord.xy+fract(T*1.7)*61.)-.5)*.06;",
      " float tex=.03*(fbm(gp*.6+t)-.5);",
      " vec3 ink=vec3(.043,.039,.031);vec3 bone=vec3(.914,.902,.867);",
      " if(MODE<.5){gl_FragColor=vec4(mix(ink,bone,C)+gn+tex*C,1.);}",
      " else{gl_FragColor=vec4(bone+gn,C*AL);}",
      "}"].join("\n");
    var pr = GLU.prog(gl, FS); if (!pr) return;
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    var U = function (n) { return gl.getUniformLocation(pr, n); };
    gl.uniform1f(U("MODE"), o.mode); gl.uniform1f(U("AL"), o.alpha);
    gl.uniform1f(U("BL"), o.baseL); gl.uniform1f(U("BR"), o.baseR); gl.uniform1f(U("AMP"), o.amp);
    var uR = U("R"), uT = U("T"), uM = U("M");
    var resize = function () { var dpr = Math.min(devicePixelRatio || 1, 1.5);
      cv.width = Math.max(2, cv.offsetWidth * dpr | 0); cv.height = Math.max(2, cv.offsetHeight * dpr | 0);
      gl.viewport(0, 0, cv.width, cv.height); gl.uniform1f(U("PX"), 6.2 * dpr); };
    resize();
    addEventListener("resize", resize);
    /* A window resize is not the only thing that changes this canvas's
       box. The archive grid loads in below it, the page gets taller, a
       scrollbar appears and every content box narrows — and the buffer
       was still sized for the page as it was before any of that, so the
       wave was drawn for a viewport that no longer existed. Watch the
       element, not the window. */
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(function () { resize(); }).observe(cv);
    }
    var draw = function (ms) { gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uT, ms); gl.uniform1f(uM, mx); gl.drawArrays(gl.TRIANGLES, 0, 3); };
    var run = true, mx = .5, mt = .5;
    if (RM) { draw(12); return; }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { run = en[0].isIntersecting; }).observe(cv);
    (cv.closest("section,footer") || cv.parentElement).addEventListener("mousemove", function (e) { mt = e.clientX / innerWidth; });
    (function fr(ms) { if (run) { mx += (mt - mx) * .05; draw(ms * .001); } requestAnimationFrame(fr); })(0);
  }

  /* The homepage's own no-WebGL fallback: a Bayer-dithered still of the
     same dunes, at cell 2. Fine enough to read as grain rather than as a
     chequerboard, and painted once — it is a fallback, not a feature. */
  function dither(sel, o) {
    o = o || {};
    var cell = o.cell || 9, color = o.color || '#E9E6DD';
    var speed = o.speed || 0.00042, still = !!o.still;
    var cv = $(sel);
    if (!cv) return;
    var ctx = cv.getContext('2d');
    if (!ctx) return;
    var B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
    var W = 0, H = 0, cols = 0, rows = 0;
    function resize() {
      W = cv.width = Math.max(2, cv.offsetWidth);
      H = cv.height = Math.max(2, cv.offsetHeight);
      cols = Math.ceil(W / cell); rows = Math.ceil(H / cell);
    }
    function paint(t) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = color;
      var tt = t * speed, y, x, u, v, r1, r2, val;
      for (y = 0; y < rows; y++) {
        v = y / rows;
        for (x = 0; x < cols; x++) {
          u = x / cols;
          r1 = .38 + .16 * Math.sin(u * 2.2 + tt) + .07 * Math.sin(u * 5.3 - tt * .6);
          r2 = .68 + .12 * Math.sin(u * 1.6 - tt * .5 + 1.7) + .06 * Math.sin(u * 4.1 + tt * .8);
          val = Math.max((v - r1) * 3.4, (v - r2) * 5) + .5;
          val = Math.max(0, Math.min(1, val));
          val = val * val * (3 - 2 * val);
          if (val > (B[y % 4][x % 4] + .5) / 16) ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }
    resize();
    addEventListener('resize', function () { resize(); paint(1200); });
    if (still || RM) { paint(1200); return; }
    var run = true, last = 0;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { run = en[0].isIntersecting; }).observe(cv);
    }
    (function frame(t) {
      if (run && t - last > 50) { last = t; paint(t); }
      requestAnimationFrame(frame);
    })(0);
  }

  /* The homepage calls this with exactly these numbers. */
  glWave('#cv-band', { mode: 0, alpha: 1, baseL: .34, baseR: .60, amp: .36 });

  /* ---------- back to top ---------- */
  var top = $('#toTop');
  if (top) top.addEventListener('click', function () {
    scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
  });
})();
