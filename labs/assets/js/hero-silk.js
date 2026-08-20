/* ============================================================
   LABS HERO — charcoal silk, relit
   ============================================================
   The same engine as the Studio hero (two A/B-looped videos as GL
   textures: the footage and a baked normal-map derived from it),
   re-tuned for fabric instead of bokeh. The normal map gives every
   fold its curvature; a soft key light follows the cursor, so the
   sheen slides across the silk toward wherever you point. Idle, the
   light stirs on its own so the surface never dies.

   Fallbacks, in order: WebGL relight → plain looping video → still.
   Reduced motion renders one lit frame and stops.
   ============================================================ */
(function heroSilk () {
  var hero = document.getElementById('hero');
  var cv = document.getElementById('cv-hero');
  var vA = document.getElementById('hvA');
  var vB = document.getElementById('hvB');
  if (!hero || !cv || !vA || !vB) return;

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SRC = window.HERO_VID, SRCN = window.HERO_VID_N;
  var flatPhoto = function () { hero.classList.add('hero-flat'); };
  var flatVideo = function () { hero.classList.add('hero-vid-flat'); vA.loop = true; var p = vA.play(); if (p && p.catch) p.catch(flatPhoto); };
  if (!SRC) { flatPhoto(); return; }

  var mkVid = function () { var v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.className = 'hv';
    hero.appendChild(v); return v; };
  var nA = SRCN ? mkVid() : null, nB = SRCN ? mkVid() : null;
  vA.src = SRC; vB.src = SRC;
  if (nA) { nA.src = SRCN; nB.src = SRCN; }

  var gl = cv.getContext('webgl', { alpha: false, depth: false, stencil: false, antialias: false });
  if (!gl) { flatVideo(); return; }

  var VS = 'attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos*.5+.5; gl_Position = vec4(aPos,0.,1.); }';

  var FS = [
    'precision highp float; varying vec2 vUv;',
    'uniform sampler2D uA, uB, uNA, uNB;',
    'uniform float uMix, uGrainT, uPar, uBlur, uFocR, uAb, uBloom, uSpec, uDiff, uSpecPow, uLightZ, uLift, uRM, uHasN;',
    'uniform vec2 uRes, uVRes, uLight;',
    'float lum(vec3 c){ return dot(c, vec3(.299,.587,.114)); }',
    'vec3 vid(vec2 uv){',
    '  vec3 a = texture2D(uA, uv).rgb;',
    '  return uMix < .001 ? a : mix(a, texture2D(uB, uv).rgb, uMix);',
    '}',
    'vec3 tap(vec2 uv, vec2 dir, float ab){',
    '  return vec3(vid(uv + dir * ab).r, vid(uv).g, vid(uv - dir * ab).b);',
    '}',
    'void main(){',
    '  float ca = uRes.x / uRes.y, va = uVRes.x / uVRes.y;',
    '  vec2 st = vUv - .5;',
    '  if (ca > va) st.y *= va / ca; else st.x *= ca / va;',
    '  vec2 uv = st + .5;',
    '  vec2 toC = vUv - uLight; toC.x *= ca;',
    '  float dC = length(toC);',
    '  vec2 dir = toC / max(dC, .0001);',
    '  float focus = smoothstep(uFocR, uFocR * 2.8, dC);',
    /* gentle 2.5D: crests (bright) drift more than valleys */
    '  float d0 = lum(vid(uv));',
    '  vec2 par = (uLight - vec2(.5)) * uPar * (d0 * 1.4 + .1);',
    '  vec2 uvp = uv - par;',
    /* soft defocus away from the light, whisper of aberration */
    '  float br = uBlur * focus;',
    '  float ab = uAb * dC * (.35 + focus);',
    '  vec3 col = tap(uvp, dir, ab) * .34;',
    '  col += tap(uvp + vec2(br, br * .6), dir, ab) * .165;',
    '  col += tap(uvp - vec2(br, br * .6), dir, ab) * .165;',
    '  col += tap(uvp + vec2(-br * .6, br), dir, ab) * .165;',
    '  col += tap(uvp + vec2(br * .6, -br), dir, ab) * .165;',
    /* the relight: fold normals against the cursor key light */
    '  if (uHasN > .5) {',
    '    vec3 n = mix(texture2D(uNA, uvp).rgb, texture2D(uNB, uvp).rgb, uMix) * 2. - 1.;',
    '    vec3 N = normalize(n);',
    '    vec3 L = normalize(vec3(-toC.x, -toC.y, uLightZ));',
    '    float diff = max(dot(N, L), 0.);',
    '    float spec = pow(max(dot(N, normalize(L + vec3(0., 0., 1.))), 0.), uSpecPow);',
    /* falloff: the key light is a pool, not a sun */
    '    float pool = smoothstep(.95, .12, dC);',
    '    col *= (1. + uDiff * (diff - .42) * (0.35 + .65 * pool));',
    '    float shmask = smoothstep(.03, .30, lum(col));',
    '    col += vec3(1., .99, .96) * spec * uSpec * pool * shmask;',
    '  }',
    /* faint bloom where the sheen gathers */
    '  float b = smoothstep(.22, .6, lum(col)) * (1. - focus * .6);',
    '  col += col * b * uBloom;',
    /* lift the toe a touch so the blacks breathe against the page */
    '  col = col + uLift * (1. - col) * .06;',
    /* quiet vignette, no text pocket: the layout shades itself in CSS */
    '  float vg = smoothstep(1.5, .55, length(vUv - vec2(.5, .5)));',
    '  col *= mix(.88, 1., vg);',
    '  col += (fract(sin(dot(gl_FragCoord.xy + fract(uGrainT) * 61., vec2(127.1, 311.7))) * 43758.5453) - .5) * .028 * (1. - uRM * .6);',
    '  gl_FragColor = vec4(col, 1.);',
    '}',
  ].join('\n');

  var sh = function (t, src) { var o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o);
    return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
  var v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS);
  if (!v || !f) { flatVideo(); return; }
  var pMain = gl.createProgram();
  gl.attachShader(pMain, v); gl.attachShader(pMain, f); gl.linkProgram(pMain);
  if (!gl.getProgramParameter(pMain, gl.LINK_STATUS)) { flatVideo(); return; }

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(pMain, 'aPos');
  var U = {}; var nU = gl.getProgramParameter(pMain, gl.ACTIVE_UNIFORMS);
  for (var i = 0; i < nU; i++) { var inf = gl.getActiveUniform(pMain, i); U[inf.name] = gl.getUniformLocation(pMain, inf.name); }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  var mkTex = function (unit) { var t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([11, 10, 8]));
    return t; };
  var texA = mkTex(0), texB = mkTex(1), texNA = mkTex(2), texNB = mkTex(3);

  var resize = function () {
    var dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.max(2, cv.clientWidth * dpr | 0);
    cv.height = Math.max(2, cv.clientHeight * dpr | 0);
  };
  resize(); addEventListener('resize', resize);

  /* dials — tuned for silk; live via window.__hero.set */
  var PAR = .030, BLUR = .0045, FOCR = .24, AB = .0005, BLOOM = .18,
      SPEC = .34, DIFF = .42, SPECPOW = 62., LIGHTZ = .72, LIFT = .5;

  var lastMove = 0;
  var lgx = .62, lgy = .55, ltx = .62, lty = .55;
  var setP = function (cx, cy) { var r = hero.getBoundingClientRect();
    ltx = (cx - r.left) / r.width; lty = 1 - (cy - r.top) / r.height;
    lastMove = performance.now(); };
  hero.addEventListener('mousemove', function (e) { setP(e.clientX, e.clientY); });
  hero.addEventListener('touchmove', function (e) { var t = e.targetTouches[0]; if (t) setP(t.clientX, t.clientY); }, { passive: true });

  var FADE = 1.1;
  var fA = vA, fB = vB, nfA = nA, nfB = nB;
  var tA = texA, tB = texB, tNA = texNA, tNB = texNB;
  var fading = false, fadeT0 = 0, mixV = 0, started = false, run = true;
  var tryPlay = function (vv) { if (vv) { var p = vv.play(); if (p && p.catch) p.catch(function () {}); } };
  var kick = function () { if (started) return; started = true;
    fA.currentTime = 0; if (nfA) nfA.currentTime = 0;
    tryPlay(fA); tryPlay(nfA); };
  vA.addEventListener('loadeddata', kick, { once: true });
  vA.addEventListener('canplaythrough', kick, { once: true });
  [vA, vB, nA, nB].forEach(function (vv) { if (!vv) return;
    vv.addEventListener('error', function () { (window.__hero = window.__hero || {}).err = 'media ' + (vv.error && vv.error.code); });
    try { vv.load(); } catch (e) {} });
  setTimeout(kick, 2600);
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    addEventListener(ev, function () { if (fA.paused && run && started) { tryPlay(fA); tryPlay(nfA); } }, { once: true, passive: true }); });

  var pauseAll = function () { [vA, vB, nA, nB].forEach(function (vv) { if (vv) vv.pause(); }); };
  new IntersectionObserver(function (en) {
    run = en[0].isIntersecting;
    if (!run) pauseAll();
    else if (started) { tryPlay(fA); tryPlay(nfA); if (fading) { tryPlay(fB); tryPlay(nfB); } }
  }).observe(hero);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pauseAll();
    else if (run && started) { tryPlay(fA); tryPlay(nfA); if (fading) { tryPlay(fB); tryPlay(nfB); } }
  });

  var upload = function (tex, vv, unit) {
    if (!vv || vv.readyState < 2) return;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, vv); } catch (e) { flatVideo(); }
  };

  var firstFrame = false, lastPump = 0;
  window.__hero = window.__hero || {}; window.__hero.tick = 0;
  window.__hero.set = function (o) {
    if (o.light) { lgx = ltx = o.light[0]; lgy = lty = o.light[1]; lastMove = performance.now() + 1e7; }
    if (o.freeLight) lastMove = 0;
    if (o.par != null) PAR = o.par;
    if (o.blur != null) BLUR = o.blur;
    if (o.focr != null) FOCR = o.focr;
    if (o.ab != null) AB = o.ab;
    if (o.bloom != null) BLOOM = o.bloom;
    if (o.spec != null) SPEC = o.spec;
    if (o.diff != null) DIFF = o.diff;
    if (o.specpow != null) SPECPOW = o.specpow;
    if (o.lightz != null) LIGHTZ = o.lightz;
    if (o.lift != null) LIFT = o.lift;
    return { PAR: PAR, BLUR: BLUR, FOCR: FOCR, AB: AB, BLOOM: BLOOM, SPEC: SPEC, DIFF: DIFF, SPECPOW: SPECPOW, LIGHTZ: LIGHTZ, LIFT: LIFT };
  };

  function render (now) {
    lastPump = now;
    var D = window.__hero;
    D.tick++; D.t = fA.currentTime; D.paused = fA.paused; D.ready = fA.readyState;
    if (!run && firstFrame) return;

    var d = fA.duration || 12.5;
    if (started && fA.ended && !fading) {
      fA.currentTime = 0; if (nfA) nfA.currentTime = 0;
      tryPlay(fA); tryPlay(nfA);
    } else if (started && !fading && fA.currentTime > d - FADE) {
      fading = true; fadeT0 = now;
      fB.currentTime = 0; if (nfB) nfB.currentTime = 0;
      tryPlay(fB); tryPlay(nfB);
    }
    if (fading) {
      mixV = Math.min(1, (now - fadeT0) / (FADE * 1000));
      if (mixV >= 1) {
        fA.pause(); if (nfA) nfA.pause();
        var t = fA; fA = fB; fB = t;
        t = nfA; nfA = nfB; nfB = t;
        var x = tA; tA = tB; tB = x;
        x = tNA; tNA = tNB; tNB = x;
        fading = false; mixV = 0;
        tryPlay(fA); tryPlay(nfA);
      }
    }

    /* idle: the light wanders the folds on its own */
    if (now - lastMove > 2600 && !RM) {
      var tt = now * .001;
      ltx = .55 + .34 * Math.sin(tt * .11);
      lty = .52 + .20 * Math.sin(tt * .08 + 1.4);
    }
    lgx += (ltx - lgx) * .07; lgy += (lty - lgy) * .07;

    upload(tA, fA, 0);
    if (fading) upload(tB, fB, 1);
    if (nfA) upload(tNA, nfA, 2);
    if (fading && nfB) upload(tNB, nfB, 3);

    gl.useProgram(pMain);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(U.uA, 0); gl.uniform1i(U.uB, 1); gl.uniform1i(U.uNA, 2); gl.uniform1i(U.uNB, 3);
    gl.uniform1f(U.uMix, fading ? mixV : 0);
    gl.uniform1f(U.uGrainT, now * .001);
    gl.uniform1f(U.uPar, PAR);
    gl.uniform1f(U.uBlur, BLUR);
    gl.uniform1f(U.uFocR, FOCR);
    gl.uniform1f(U.uAb, AB);
    gl.uniform1f(U.uBloom, BLOOM);
    gl.uniform1f(U.uSpec, SPEC);
    gl.uniform1f(U.uDiff, DIFF);
    gl.uniform1f(U.uSpecPow, SPECPOW);
    gl.uniform1f(U.uLightZ, LIGHTZ);
    gl.uniform1f(U.uLift, LIFT);
    gl.uniform1f(U.uRM, RM ? 1 : 0);
    gl.uniform1f(U.uHasN, nA ? 1 : 0);
    gl.uniform2f(U.uRes, cv.width, cv.height);
    gl.uniform2f(U.uVRes, fA.videoWidth || 1920, fA.videoHeight || 1080);
    gl.uniform2f(U.uLight, lgx, lgy);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, cv.width, cv.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (fA.readyState >= 2) firstFrame = true;

    if (RM && firstFrame) { pauseAll(); run = false; }
  }
  (function pump (now) { requestAnimationFrame(pump); render(now || 0); })(0);
  setInterval(function () { var n = performance.now(); if (n - lastPump > 700) render(n); }, 500);
})();
