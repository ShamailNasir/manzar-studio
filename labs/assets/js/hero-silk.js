/* ============================================================
   LABS HERO — charcoal silk, shot on glass          (engine v5)
   ============================================================
   ONE video carries everything: the footage on top and its baked
   normal-map strip beneath (1920x1620 atlas). One element means the
   lighting can never fall out of step with the cloth - the two-video
   build wrapped its tracks at slightly different instants, and that
   lighting pop is what read as a "hard transition" at the loop. The
   file itself is loop-baked (tail crossfaded into head at encode
   time), so playback is a native `loop` with nothing to fade.

   The look, in order:
   - orbiting key light against the baked normals (diffuse breath,
     anisotropic silk sheen, silver rim)
   - clarity: unsharp micro-contrast in the weave
   - anamorphic streak bloom: crest highlights bleed into short
     horizontal silver streaks, the cinema-lens signature
   - halation: a soft warm-neutral glow around the brightest folds
   - corner-true chromatic aberration: zero at centre, growing with
     the square of the radius, the way real glass fringes
   - filmic S-curve over a lifted toe, breathing zoom, gate weave
     (sub-pixel frame wobble), fine animated grain, quiet vignette

   Fallbacks: WebGL -> plain video (cropped via CSS) -> still.
   Reduced motion renders one lit frame and stops.
   ============================================================ */
(function heroSilk () {
  var hero = document.getElementById('hero');
  var cv = document.getElementById('cv-hero');
  var vA = document.getElementById('hvA');
  if (!hero || !cv || !vA) return;

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SRC = window.HERO_VID;
  var flatPhoto = function () { hero.classList.add('hero-flat'); };
  var flatVideo = function () { hero.classList.add('hero-vid-flat'); vA.loop = true; var p = vA.play(); if (p && p.catch) p.catch(flatPhoto); };
  if (!SRC) { flatPhoto(); return; }

  vA.src = SRC; vA.loop = true;
  /* the last notch of calm. load() resets playbackRate, so it is pinned
     via defaultPlaybackRate AND re-asserted once media is ready. */
  var RATE = 0.85;
  vA.defaultPlaybackRate = RATE; vA.playbackRate = RATE;
  vA.addEventListener('loadeddata', function () { vA.playbackRate = RATE; });

  var gl = cv.getContext('webgl', { alpha: false, depth: false, stencil: false, antialias: false });
  if (!gl) { flatVideo(); return; }

  var VS = 'attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos*.5+.5; gl_Position = vec4(aPos,0.,1.); }';

  /* atlas geometry: with FLIP_Y uploads, texture v runs bottom-up the
     image. Colour occupies image rows 0..1080 (top) -> tex v in
     [1/3, 1]; the normal strip rows 1080..1620 -> tex v in [0, 1/3]. */
  var FS = [
    'precision highp float; varying vec2 vUv;',
    'uniform sampler2D uA;',
    'uniform float uGrainT, uDiff, uSpec, uSpecPow, uAniso, uRim, uLift, uGrain, uRM;',
    'uniform float uClar, uCurve, uZoom, uCA, uStreak, uHal, uWeaveT;',
    'uniform vec2 uRes;',
    'uniform vec3 uL;',
    'const vec2 VRES = vec2(1920., 1080.);',
    'float lum(vec3 c){ return dot(c, vec3(.299,.587,.114)); }',
    'vec2 cuv(vec2 uv){ return vec2(uv.x, mix(1./3., 1., clamp(uv.y, 0., 1.))); }',
    'vec2 nuv(vec2 uv){ return vec2(uv.x, mix(0., 1./3., clamp(uv.y, 0., 1.))); }',
    'vec3 vid(vec2 uv){ return texture2D(uA, cuv(uv)).rgb; }',
    'void main(){',
    '  float ca = uRes.x / uRes.y, va = VRES.x / VRES.y;',
    '  vec2 st = vUv - .5;',
    '  if (ca > va) st.y *= va / ca; else st.x *= ca / va;',
    '  st /= uZoom;',
    /* gate weave: the frame is never machine-still */
    '  st += vec2(sin(uWeaveT * 1.7), cos(uWeaveT * 1.3)) * .00032;',
    '  vec2 uv = st + .5;',
    /* corner-true CA: real glass fringes at the edge of field, never
       the centre. Radial shift grows with r^2. */
    '  vec2 pc = vUv - .5; pc.x *= ca;',
    '  float r2 = dot(pc, pc);',
    '  vec2 cad = normalize(pc + 1e-6) * uCA * r2;',
    '  vec3 col;',
    '  col.r = vid(uv + cad).r;',
    '  col.g = vid(uv).g;',
    '  col.b = vid(uv - cad).b;',
    /* clarity: micro-contrast in the weave */
    '  vec2 tx = 1.4 / VRES;',
    '  vec3 nb = vid(uv + vec2(tx.x, 0.)) + vid(uv - vec2(tx.x, 0.))',
    '          + vid(uv + vec2(0., tx.y)) + vid(uv - vec2(0., tx.y));',
    '  col = clamp(col + (col - nb * .25) * uClar, 0., 1.);',
    '  float l0 = lum(col);',
    /* the relight */
    '  vec3 N = normalize(texture2D(uA, nuv(uv)).rgb * 2. - 1.);',
    '  vec3 L = normalize(uL);',
    '  float d = clamp(dot(N, L) * .5 + .5, 0., 1.);',
    '  d = pow(d, 1.5);',
    '  col *= mix(1. - uDiff * .55, 1. + uDiff * .75, d);',
    '  vec3 Na = normalize(N * vec3(uAniso, 1., 1.));',
    '  vec3 H = normalize(L + vec3(0., 0., 1.));',
    '  float s = pow(max(dot(Na, H), 0.), uSpecPow);',
    '  float crest = smoothstep(.05, .30, l0);',
    '  col += vec3(.96, .97, 1.) * s * uSpec * crest;',
    '  float rim = pow(1. - abs(N.z), 2.6);',
    '  col += vec3(.9, .92, .98) * rim * uRim * smoothstep(.03, .2, l0);',
    /* anamorphic streak: the sheen bleeds sideways like a cine lens */
    '  float px = 1. / VRES.x;',
    '  float bp = 0.;',
    '  bp += max(lum(vid(uv + vec2(px * 3.5, 0.))) - .30, 0.) * .30;',
    '  bp += max(lum(vid(uv - vec2(px * 3.5, 0.))) - .30, 0.) * .30;',
    '  bp += max(lum(vid(uv + vec2(px * 8., 0.))) - .30, 0.) * .21;',
    '  bp += max(lum(vid(uv - vec2(px * 8., 0.))) - .30, 0.) * .21;',
    '  bp += max(lum(vid(uv + vec2(px * 14., 0.))) - .30, 0.) * .12;',
    '  bp += max(lum(vid(uv - vec2(px * 14., 0.))) - .30, 0.) * .12;',
    '  col += vec3(.9, .95, 1.06) * bp * uStreak;',
    /* halation: emulsion glow around the hot folds */
    '  vec2 hx = 6.5 / VRES;',
    '  float hl = 0.;',
    '  hl += max(lum(vid(uv + hx)) - .34, 0.);',
    '  hl += max(lum(vid(uv - hx)) - .34, 0.);',
    '  hl += max(lum(vid(uv + vec2(hx.x, -hx.y))) - .34, 0.);',
    '  hl += max(lum(vid(uv + vec2(-hx.x, hx.y))) - .34, 0.);',
    '  col += vec3(1.03, 1., .97) * hl * .25 * uHal;',
    /* the grade */
    '  col = col + uLift * (1. - col) * .05;',
    '  vec3 scv = col * col * (3. - 2. * col);',
    '  col = mix(col, scv, uCurve);',
    '  col = pow(col, vec3(.965));',
    '  float vg = smoothstep(1.55, .55, length(vUv - vec2(.5, .5)));',
    '  col *= mix(.88, 1., vg);',
    '  col += (fract(sin(dot(gl_FragCoord.xy + fract(uGrainT) * 61., vec2(127.1, 311.7))) * 43758.5453) - .5) * uGrain * (1. - uRM * .6);',
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

  var tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([11, 10, 8]));

  var resize = function () {
    var dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.max(2, cv.clientWidth * dpr | 0);
    cv.height = Math.max(2, cv.clientHeight * dpr | 0);
  };
  resize(); addEventListener('resize', resize);

  /* dials — live via window.__hero.set */
  var DIFF = .32, SPEC = .36, SPECPOW = 84., ANISO = .45, RIM = .09,
      LIFT = .55, GRAIN = .034, ORBIT = .07, ELEV = .60,
      CLAR = .5, CURVE = .36, CA = .0035, STREAK = .5, HAL = .5;

  var started = false, run = true;
  var tryPlay = function (vv) { if (vv) { var p = vv.play(); if (p && p.catch) p.catch(function () {}); } };
  var kick = function () { if (started) return; started = true; tryPlay(vA); };
  vA.addEventListener('loadeddata', kick, { once: true });
  vA.addEventListener('canplaythrough', kick, { once: true });
  vA.addEventListener('error', function () { (window.__hero = window.__hero || {}).err = 'media ' + (vA.error && vA.error.code); });
  try { vA.load(); } catch (e) {}
  setTimeout(kick, 2600);
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    addEventListener(ev, function () { if (vA.paused && run && started) tryPlay(vA); }, { once: true, passive: true }); });

  new IntersectionObserver(function (en) {
    run = en[0].isIntersecting;
    if (!run) vA.pause();
    else if (started) tryPlay(vA);
  }).observe(hero);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) vA.pause();
    else if (run && started) tryPlay(vA);
  });

  var firstFrame = false, lastPump = 0;
  window.__hero = window.__hero || {}; window.__hero.tick = 0;
  window.__hero.set = function (o) {
    if (o.diff != null) DIFF = o.diff;
    if (o.spec != null) SPEC = o.spec;
    if (o.specpow != null) SPECPOW = o.specpow;
    if (o.aniso != null) ANISO = o.aniso;
    if (o.rim != null) RIM = o.rim;
    if (o.lift != null) LIFT = o.lift;
    if (o.grain != null) GRAIN = o.grain;
    if (o.orbit != null) ORBIT = o.orbit;
    if (o.elev != null) ELEV = o.elev;
    if (o.clar != null) CLAR = o.clar;
    if (o.curve != null) CURVE = o.curve;
    if (o.ca != null) CA = o.ca;
    if (o.streak != null) STREAK = o.streak;
    if (o.hal != null) HAL = o.hal;
    if (o.rate != null) { RATE = o.rate; vA.defaultPlaybackRate = RATE; vA.playbackRate = RATE; }
    if (o.phase != null) window.__hero.phase = o.phase;
    return { DIFF: DIFF, SPEC: SPEC, SPECPOW: SPECPOW, ANISO: ANISO, RIM: RIM, LIFT: LIFT,
             GRAIN: GRAIN, ORBIT: ORBIT, ELEV: ELEV, CLAR: CLAR, CURVE: CURVE,
             CA: CA, STREAK: STREAK, HAL: HAL, rate: vA.playbackRate };
  };

  function render (now) {
    lastPump = now;
    var D = window.__hero;
    D.tick++; D.t = vA.currentTime; D.paused = vA.paused; D.ready = vA.readyState;
    if (!run && firstFrame) return;

    var t = (D.phase != null ? D.phase : now * .001);
    var az = t * ORBIT;
    var el = ELEV + .14 * Math.sin(t * .045 + 1.1);
    var Lx = Math.cos(az), Ly = Math.sin(az) * .7;
    var zoom = 1.0 + .04 * (0.5 + 0.5 * Math.sin(t * .032));

    if (vA.readyState >= 2) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, vA); } catch (e) { flatVideo(); return; }
    }

    gl.useProgram(pMain);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(U.uA, 0);
    gl.uniform1f(U.uGrainT, now * .001);
    gl.uniform1f(U.uDiff, DIFF);
    gl.uniform1f(U.uSpec, SPEC);
    gl.uniform1f(U.uSpecPow, SPECPOW);
    gl.uniform1f(U.uAniso, ANISO);
    gl.uniform1f(U.uRim, RIM);
    gl.uniform1f(U.uLift, LIFT);
    gl.uniform1f(U.uGrain, GRAIN);
    gl.uniform1f(U.uRM, RM ? 1 : 0);
    gl.uniform1f(U.uClar, CLAR);
    gl.uniform1f(U.uCurve, CURVE);
    gl.uniform1f(U.uZoom, zoom);
    gl.uniform1f(U.uCA, CA);
    gl.uniform1f(U.uStreak, STREAK);
    gl.uniform1f(U.uHal, HAL);
    gl.uniform1f(U.uWeaveT, now * .001);
    gl.uniform2f(U.uRes, cv.width, cv.height);
    gl.uniform3f(U.uL, Lx, Ly, el);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, cv.width, cv.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (vA.readyState >= 2) firstFrame = true;

    if (RM && firstFrame) { vA.pause(); run = false; }
  }
  (function pump (now) { requestAnimationFrame(pump); render(now || 0); })(0);
  setInterval(function () { var n = performance.now(); if (n - lastPump > 700) render(n); }, 500);
})();
