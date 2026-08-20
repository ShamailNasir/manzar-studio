/* ============================================================
   LABS HERO — charcoal silk, studio-lit
   ============================================================
   v2. No cursor coupling of any kind: the footage is lit like a
   product film. A slow key light orbits the cloth on its own —
   the baked normal-map video gives every fold its curvature, and
   as the light travels, the sheen migrates across the silk:
   anisotropic highlights streak along the folds (silk reflects
   along its threads, not in points), fold edges carry a faint
   silver rim, and the whole frame breathes.

   Both videos are loop-baked (the file's tail crossfades into its
   head at encode time), so playback is native `loop` with no seam
   and no runtime fading. The normal track is kept in step with the
   footage by a gentle drift check.

   Fallbacks: WebGL relight → plain looping video → still.
   Reduced motion renders one lit frame and stops.
   ============================================================ */
(function heroSilk () {
  var hero = document.getElementById('hero');
  var cv = document.getElementById('cv-hero');
  var vA = document.getElementById('hvA');
  if (!hero || !cv || !vA) return;

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SRC = window.HERO_VID, SRCN = window.HERO_VID_N;
  var flatPhoto = function () { hero.classList.add('hero-flat'); };
  var flatVideo = function () { hero.classList.add('hero-vid-flat'); vA.loop = true; var p = vA.play(); if (p && p.catch) p.catch(flatPhoto); };
  if (!SRC) { flatPhoto(); return; }

  var nV = null;
  if (SRCN) {
    nV = document.createElement('video');
    nV.muted = true; nV.playsInline = true; nV.preload = 'auto'; nV.loop = true;
    nV.className = 'hv';
    hero.appendChild(nV);
    nV.src = SRCN;
  }
  vA.src = SRC; vA.loop = true;

  var gl = cv.getContext('webgl', { alpha: false, depth: false, stencil: false, antialias: false });
  if (!gl) { flatVideo(); return; }

  var VS = 'attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos*.5+.5; gl_Position = vec4(aPos,0.,1.); }';

  var FS = [
    'precision highp float; varying vec2 vUv;',
    'uniform sampler2D uA, uN;',
    'uniform float uGrainT, uDiff, uSpec, uSpecPow, uAniso, uRim, uLift, uGrain, uRM, uHasN;',
    'uniform vec2 uRes, uVRes;',
    'uniform vec3 uL;',
    'float lum(vec3 c){ return dot(c, vec3(.299,.587,.114)); }',
    'void main(){',
    '  float ca = uRes.x / uRes.y, va = uVRes.x / uVRes.y;',
    '  vec2 st = vUv - .5;',
    '  if (ca > va) st.y *= va / ca; else st.x *= ca / va;',
    '  vec2 uv = st + .5;',
    '  vec3 col = texture2D(uA, uv).rgb;',
    '  float l0 = lum(col);',
    '  if (uHasN > .5) {',
    '    vec3 N = normalize(texture2D(uN, uv).rgb * 2. - 1.);',
    '    vec3 L = normalize(uL);',
    /* soft wrap diffuse: the cloth breathes as the key orbits */
    '    float d = clamp(dot(N, L) * .5 + .5, 0., 1.);',
    '    d = pow(d, 1.5);',
    '    col *= mix(1. - uDiff * .55, 1. + uDiff * .75, d);',
    /* anisotropic sheen: the normal is squashed across X so the
       specular lobe stretches horizontally along the folds - silk
       reflects along its threads, not in points */
    '    vec3 Na = normalize(N * vec3(uAniso, 1., 1.));',
    '    vec3 H = normalize(L + vec3(0., 0., 1.));',
    '    float s = pow(max(dot(Na, H), 0.), uSpecPow);',
    '    float crest = smoothstep(.05, .30, l0);',
    '    col += vec3(.96, .97, 1.) * s * uSpec * crest;',
    /* fold edges catch a whisper of silver rim */
    '    float rim = pow(1. - abs(N.z), 2.6);',
    '    col += vec3(.9, .92, .98) * rim * uRim * smoothstep(.03, .2, l0);',
    '  }',
    /* filmic shaping: lift the toe, keep the blacks alive */
    '  col = col + uLift * (1. - col) * .05;',
    '  col = pow(col, vec3(.97));',
    /* gentle vignette */
    '  float vg = smoothstep(1.55, .55, length(vUv - vec2(.5, .5)));',
    '  col *= mix(.88, 1., vg);',
    /* animated grain: alive, and it dissolves any banding in the darks */
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

  var mkTex = function (unit) { var t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([11, 10, 8]));
    return t; };
  var texA = mkTex(0), texN = mkTex(1);

  var resize = function () {
    var dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.max(2, cv.clientWidth * dpr | 0);
    cv.height = Math.max(2, cv.clientHeight * dpr | 0);
  };
  resize(); addEventListener('resize', resize);

  /* dials — live via window.__hero.set */
  var DIFF = .34, SPEC = .38, SPECPOW = 84., ANISO = .45, RIM = .10,
      LIFT = .5, GRAIN = .032, ORBIT = .10, ELEV = .58;

  var started = false, run = true;
  var tryPlay = function (vv) { if (vv) { var p = vv.play(); if (p && p.catch) p.catch(function () {}); } };
  var kick = function () { if (started) return; started = true; tryPlay(vA); tryPlay(nV); };
  vA.addEventListener('loadeddata', kick, { once: true });
  vA.addEventListener('canplaythrough', kick, { once: true });
  [vA, nV].forEach(function (vv) { if (!vv) return;
    vv.addEventListener('error', function () { (window.__hero = window.__hero || {}).err = 'media ' + (vv.error && vv.error.code); });
    try { vv.load(); } catch (e) {} });
  setTimeout(kick, 2600);
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    addEventListener(ev, function () { if (vA.paused && run && started) { tryPlay(vA); tryPlay(nV); } }, { once: true, passive: true }); });

  var pauseAll = function () { vA.pause(); if (nV) nV.pause(); };
  new IntersectionObserver(function (en) {
    run = en[0].isIntersecting;
    if (!run) pauseAll();
    else if (started) { tryPlay(vA); tryPlay(nV); }
  }).observe(hero);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pauseAll();
    else if (run && started) { tryPlay(vA); tryPlay(nV); }
  });

  /* the normal track shadows the footage; a nudge if they drift */
  var syncN = function (hard) {
    if (!nV || !isFinite(vA.currentTime)) return;
    var d = Math.abs(nV.currentTime - vA.currentTime);
    if (d > (hard ? .3 : .05)) nV.currentTime = vA.currentTime;
  };
  setInterval(function () { if (!vA.paused) syncN(false); }, 700);
  vA.addEventListener('seeked', function () { syncN(false); });

  var upload = function (tex, vv, unit) {
    if (!vv || vv.readyState < 2) return;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, vv); } catch (e) { flatVideo(); }
  };

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
    if (o.phase != null) window.__hero.phase = o.phase;
    return { DIFF: DIFF, SPEC: SPEC, SPECPOW: SPECPOW, ANISO: ANISO, RIM: RIM, LIFT: LIFT, GRAIN: GRAIN, ORBIT: ORBIT, ELEV: ELEV };
  };

  function render (now) {
    lastPump = now;
    var D = window.__hero;
    D.tick++; D.t = vA.currentTime; D.paused = vA.paused; D.ready = vA.readyState;
    if (!run && firstFrame) return;

    /* the key light orbits slowly; its elevation breathes */
    var t = (D.phase != null ? D.phase : now * .001);
    var az = t * ORBIT;
    var el = ELEV + .16 * Math.sin(t * .05 + 1.1);
    var Lx = Math.cos(az), Ly = Math.sin(az) * .7;

    syncN(true);
    upload(texA, vA, 0);
    if (nV) upload(texN, nV, 1);

    gl.useProgram(pMain);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(U.uA, 0); gl.uniform1i(U.uN, 1);
    gl.uniform1f(U.uGrainT, now * .001);
    gl.uniform1f(U.uDiff, DIFF);
    gl.uniform1f(U.uSpec, SPEC);
    gl.uniform1f(U.uSpecPow, SPECPOW);
    gl.uniform1f(U.uAniso, ANISO);
    gl.uniform1f(U.uRim, RIM);
    gl.uniform1f(U.uLift, LIFT);
    gl.uniform1f(U.uGrain, GRAIN);
    gl.uniform1f(U.uRM, RM ? 1 : 0);
    gl.uniform1f(U.uHasN, nV ? 1 : 0);
    gl.uniform2f(U.uRes, cv.width, cv.height);
    gl.uniform2f(U.uVRes, vA.videoWidth || 1920, vA.videoHeight || 1080);
    gl.uniform3f(U.uL, Lx, Ly, el);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, cv.width, cv.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (vA.readyState >= 2) firstFrame = true;

    if (RM && firstFrame) { pauseAll(); run = false; }
  }
  (function pump (now) { requestAnimationFrame(pump); render(now || 0); })(0);
  setInterval(function () { var n = performance.now(); if (n - lastPump > 700) render(n); }, 500);
})();
