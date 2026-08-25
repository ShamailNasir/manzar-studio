/* ============================================================
   LABS HERO - underground trains, long exposure     (engine v17)
   Footage: 4-clip London Underground reel (17.05s loop, 1600x1350
   atlas @60fps, self-xfade loop-baked, normals rebaked; clips 1+3
   at 1.45x). Engine is the approved v8 pipeline + v17 optics:
   normal-map refraction, edge defocus, wide halation, silver print.
   ============================================================
   v7's dark-cinema relight stays. v8 adds the thing every grade
   so far could not: OPTICS. The silk now reads as macro footage
   on a wide-open cinema prime - a razor-thin band of focus with
   everything else melting into creamy, highlight-weighted blur
   (bokeh), and the focus plane itself slowly drifting up and down
   the frame (a rack focus). Defocus also erases what remains of
   the codec's fingerprints - blur is the honest end of
   "make it look higher quality".

   PASS A - the scene (renders into a framebuffer)
     v7 unchanged: one atlas video (footage + baked normals, one
     clock, loop-baked); normals amplified (uNAmp) + rotated silk-
     weave detail normal, whiteout-blended, crest-weighted; one
     cool orbiting key; wrap diffuse; SILVER Charlie sheen
     [Estevez & Kulla 2017] + anisotropic gleam + rim; restrained
     3-tap chromatic aberration with a centre floor; cool
     anamorphic streaks; faint halation; micro-soften + clarity.
     No grade here - the grade belongs after the glass.

   PASS B - the lens (framebuffer -> screen)
     - tilt-shift DEPTH OF FIELD: per-pixel blur radius grows with
       distance from an animated focus line. The gather is a
       Vogel/golden-angle spiral disc (uniform coverage, the
       standard single-pass bokeh pattern), per-pixel rotated so
       undersampling dithers into noise the grain then owns.
       Samples are weighted 1 + luma^2 * uBokeh - defocused
       highlights bloom into bright discs, the bokeh signature.
     - RACK FOCUS: the focus line breathes through the frame
       (sin, ~60s period), so the image is alive even where the
       cloth rests.
     - then the dark-cinema grade, after the optics as a colorist
       would: steel-blue shadows / silver highlights split tone,
       ACES filmic curve [Narkowicz fit] with exposure dial, black
       crush, deep vignette, fine animated grain (after the blur -
       grain over cream is what keeps "soft" from becoming
       "smeared").

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
  var RATE = 0.85;
  vA.defaultPlaybackRate = RATE; vA.playbackRate = RATE;
  vA.addEventListener('loadeddata', function () { vA.playbackRate = RATE; });

  var gl = cv.getContext('webgl', { alpha: false, depth: false, stencil: false, antialias: false });
  if (!gl) { flatVideo(); return; }

  var VS = 'attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos*.5+.5; gl_Position = vec4(aPos,0.,1.); }';

  /* ---------------- PASS A: the scene ---------------- */
  var FSA = [
    'precision highp float; varying vec2 vUv;',
    'uniform sampler2D uA, uW;',
    'uniform float uDiff, uSpec, uSpecPow, uAniso, uRim;',
    'uniform float uClar, uSoft, uZoom, uCAc, uCA, uStreak, uHal;',
    'uniform float uNAmp, uDet, uSheen, uSheenR, uDistort;',
    'uniform vec2 uRes, uTile;',
    'uniform vec3 uL;',
    'const vec2 VRES = vec2(1920., 1080.);',
    'const float PI = 3.14159265;',
    'float lum(vec3 c){ return dot(c, vec3(.299,.587,.114)); }',
    'vec2 cuv(vec2 uv){ return vec2(uv.x, mix(1./3., 1., clamp(uv.y, 0., 1.))); }',
    'vec2 nuv(vec2 uv){ return vec2(uv.x, mix(0., 1./3., clamp(uv.y, 0., 1.))); }',
    'vec3 vid(vec2 uv){ return texture2D(uA, cuv(uv)).rgb; }',
    'float D_Charlie(float a, float NoH){',
    '  float ia = 1. / a;',
    '  float s2 = max(1. - NoH * NoH, .0078125);',
    '  return (2. + ia) * pow(s2, ia * .5) / (2. * PI);',
    '}',
    'void main(){',
    '  float ca = uRes.x / uRes.y, va = VRES.x / VRES.y;',
    '  vec2 st = vUv - .5;',
    '  if (ca > va) st.y *= va / ca; else st.x *= ca / va;',
    '  st /= uZoom;',
    /* v17: the baked normals REFRACT the image itself - a subtle
       glass-shimmer displacement, so the relief is felt as motion */
    '  vec2 uv0 = st + .5;',
    '  vec3 nbe = texture2D(uA, nuv(uv0)).rgb * 2. - 1.;',
    '  vec2 uv = uv0 + nbe.xy * uDistort;',
    '  vec2 pc = vUv - .5; pc.x *= ca;',
    '  float r2 = dot(pc, pc);',
    '  vec2 cad = normalize(pc + 1e-6) * (uCAc + uCA * r2);',
    '  vec2 sx = uSoft / VRES;',
    '  vec3 base = vid(uv) * .40',
    '            + vid(uv + sx) * .15 + vid(uv - sx) * .15',
    '            + vid(uv + vec2(sx.x, -sx.y)) * .15 + vid(uv + vec2(-sx.x, sx.y)) * .15;',
    '  vec3 col;',
    '  col.r = mix(base.r, vid(uv + cad).r, .85);',
    '  col.g = base.g;',
    '  col.b = mix(base.b, vid(uv - cad).b, .85);',
    '  vec2 tx = 1.4 / VRES;',
    '  vec3 nb4 = vid(uv + vec2(tx.x, 0.)) + vid(uv - vec2(tx.x, 0.))',
    '           + vid(uv + vec2(0., tx.y)) + vid(uv - vec2(0., tx.y));',
    '  col = clamp(col + (col - nb4 * .25) * uClar, 0., 1.);',
    '  float l0 = lum(col);',
    '  vec3 nb = nbe;',
    '  nb.xy *= uNAmp; nb = normalize(nb);',
    '  vec2 wuv = mat2(.866, -.5, .5, .866) * (uv * uTile);',
    '  vec3 nd = texture2D(uW, wuv).rgb * 2. - 1.;',
    '  float dk = uDet * (.3 + .7 * smoothstep(.05, .35, l0));',
    '  nd = normalize(mix(vec3(0., 0., 1.), nd, dk));',
    '  vec3 N = normalize(vec3(nb.xy + nd.xy, nb.z * nd.z));',
    '  vec3 L = normalize(uL);',
    '  float d = clamp(dot(N, L) * .5 + .5, 0., 1.);',
    '  d = pow(d, 1.4);',
    '  col *= mix(1. - uDiff * .55, 1. + uDiff * .80, d);',
    '  vec3 H = normalize(L + vec3(0., 0., 1.));',
    '  float NoH = max(dot(N, H), 0.);',
    '  float NoL = max(dot(N, L), 0.);',
    '  float NoV = max(N.z, 0.);',
    '  float sheen = D_Charlie(uSheenR, NoH) * NoL / (4. * (NoL + NoV - NoL * NoV) + 1e-4);',
    '  vec3 Na = normalize(N * vec3(uAniso, 1., 1.));',
    '  float sa = pow(max(dot(Na, H), 0.), uSpecPow);',
    '  float crest = smoothstep(.03, .26, l0);',
    '  col += vec3(.93, .96, 1.03) * (sheen * uSheen + sa * uSpec) * crest;',
    '  float rim = pow(1. - abs(N.z), 2.5);',
    '  col += vec3(.88, .93, 1.02) * rim * uRim * crest;',
    '  float px = 1. / VRES.x;',
    '  float bp = 0.;',
    '  bp += max(lum(vid(uv + vec2(px * 3.5, 0.))) - .34, 0.) * .30;',
    '  bp += max(lum(vid(uv - vec2(px * 3.5, 0.))) - .34, 0.) * .30;',
    '  bp += max(lum(vid(uv + vec2(px * 8., 0.))) - .34, 0.) * .21;',
    '  bp += max(lum(vid(uv - vec2(px * 8., 0.))) - .34, 0.) * .21;',
    '  bp += max(lum(vid(uv + vec2(px * 14., 0.))) - .34, 0.) * .12;',
    '  bp += max(lum(vid(uv - vec2(px * 14., 0.))) - .34, 0.) * .12;',
    '  col += vec3(.85, .92, 1.08) * bp * uStreak;',
    '  vec2 hx = 6.5 / VRES;',
    '  float hl = 0.;',
    '  hl += max(lum(vid(uv + hx)) - .36, 0.);',
    '  hl += max(lum(vid(uv - hx)) - .36, 0.);',
    '  hl += max(lum(vid(uv + vec2(hx.x, -hx.y))) - .36, 0.);',
    '  hl += max(lum(vid(uv + vec2(-hx.x, hx.y))) - .36, 0.);',
    '  col += vec3(.98, 1., 1.03) * hl * .12 * uHal;',
    '  gl_FragColor = vec4(col, 1.);',
    '}',
  ].join('\n');

  /* ---------------- PASS B: the lens ---------------- */
  var FSB = [
    'precision highp float; varying vec2 vUv;',
    'uniform sampler2D uT;',
    'uniform float uTime, uBlur, uBokeh, uFocusW, uFeather, uRackA, uRackS;',
    'uniform float uExp, uGrain, uGrainT, uRM;',
    'uniform float uEdgeB, uEdgeS, uGlow, uDesat, uVig, uBaseB;',
    'uniform vec2 uRes;',
    'const int NTAP = 20;',
    'float lum(vec3 c){ return dot(c, vec3(.299,.587,.114)); }',
    'vec3 aces(vec3 x){',
    '  return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.);',
    '}',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'void main(){',
    '  vec2 uv = vUv;',
    /* rack focus: the focus line breathes through the frame */
    '  float focusY = .5 + uRackA * sin(uTime * uRackS + .7);',
    '  float dy = abs(vUv.y - focusY);',
    '  float coc = uBlur * pow(smoothstep(uFocusW, uFeather, dy), 1.2);',
    /* v17: cinema-prime edge falloff - dead sharp centre, the frame
       corners melt into defocus like a wide-open vintage lens */
    '  vec2 q = vUv - .5; q.x *= uRes.x / uRes.y;',
    '  float rr = length(q);',
    '  coc = max(coc, uEdgeB * smoothstep(uEdgeS, 1.15, rr));',
    /* v17.1: base "HD blur" - a small always-on circle of confusion,
       resolved by the same Vogel gather, softens the digital edge of
       the whole frame without ever reading as out-of-focus */
    '  coc = max(coc, uBaseB);',
    '  coc *= uRes.y / 1080.;',
    '  vec3 col;',
    '  if (coc < .6) {',
    '    col = texture2D(uT, uv).rgb;',
    '  } else {',
    /* Vogel spiral gather, per-pixel rotated; samples weighted by
       1 + luma^2 * uBokeh so defocused highlights bloom into discs */
    '    float rot = hash(gl_FragCoord.xy) * 6.28318;',
    '    vec3 acc = vec3(0.); float wsum = 0.;',
    '    for (int i = 0; i < NTAP; i++) {',
    '      float fi = float(i);',
    '      float a = fi * 2.39996 + rot;',
    '      float r = sqrt((fi + .5) / float(NTAP)) * coc;',
    '      vec2 off = vec2(cos(a), sin(a)) * r / uRes;',
    '      vec3 s = texture2D(uT, uv + off).rgb;',
    '      float w = 1. + lum(s) * lum(s) * uBokeh;',
    '      acc += s * w; wsum += w;',
    '    }',
    '    col = acc / wsum;',
    '  }',
    /* v17: wide thresholded halation - only what is already bright
       (train windows, tunnel lamps) blooms across the frame */
    '  vec2 gpx = 1. / uRes;',
    '  vec3 glo = vec3(0.);',
    '  for (int i = 0; i < 8; i++) {',
    '    float ga = float(i) * .7854;',
    '    float gr = mix(22., 44., mod(float(i), 2.));',
    '    vec3 gs = texture2D(uT, uv + vec2(cos(ga), sin(ga)) * gr * gpx).rgb;',
    '    glo += max(gs - .45, 0.);',
    '  }',
    '  col += glo * (uGlow / 8.) * vec3(1., 1., 1.02);',
    /* the silver-print grade, after the optics */
    '  float lm = lum(col);',
    '  col = mix(col, vec3(lm), uDesat);',
    '  col = aces(col * uExp);',
    '  col = mix(col, col * col * (3. - 2. * col), .14);',
    '  col = max(col - .012, 0.) / .988;',
    '  float vg = smoothstep(1.38, .42, length(vUv - vec2(.5, .5)));',
    '  col *= mix(uVig, 1., vg);',
    /* coarse, luma-weighted photochemical grain - lives in the mids,
       stays out of the deep blacks and the blown windows */
    '  float lg = lum(col);',
    '  float gA = mix(.45, 1., smoothstep(0., .22, lg)) * mix(1., .55, smoothstep(.72, 1., lg));',
    '  col += (fract(sin(dot(floor(gl_FragCoord.xy / 1.5) + fract(uGrainT) * 61., vec2(127.1, 311.7))) * 43758.5453) - .5) * uGrain * gA * (1. - uRM * .6);',
    '  gl_FragColor = vec4(col, 1.);',
    '}',
  ].join('\n');

  var sh = function (t, src) { var o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o);
    return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
  var mkProg = function (fs) {
    var v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
  };
  var pA = mkProg(FSA), pB = mkProg(FSB);
  if (!pA || !pB) { flatVideo(); return; }
  var uniforms = function (p) {
    var U = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var inf = gl.getActiveUniform(p, i); U[inf.name] = gl.getUniformLocation(p, inf.name); }
    return U;
  };
  var UA = uniforms(pA), UB = uniforms(pB);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPosA = gl.getAttribLocation(pA, 'aPos');
  var aPosB = gl.getAttribLocation(pB, 'aPos');
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  var mkTex = function () {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };

  /* unit 0: atlas video */
  gl.activeTexture(gl.TEXTURE0);
  var texV = mkTex();
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([11, 10, 8]));

  /* unit 1: silk-weave detail normal */
  gl.activeTexture(gl.TEXTURE1);
  var texW = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texW);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 255]));
  if (window.WEAVE_NRM) {
    var wImg = new Image();
    wImg.onload = function () {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texW);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, wImg);
      gl.generateMipmap(gl.TEXTURE_2D);
    };
    wImg.src = window.WEAVE_NRM;
  }

  /* unit 2 + framebuffer: the scene target */
  gl.activeTexture(gl.TEXTURE2);
  var texS = mkTex();
  var fbo = gl.createFramebuffer();
  var fboW = 0, fboH = 0;
  var sizeFBO = function () {
    if (fboW === cv.width && fboH === cv.height) return;
    fboW = cv.width; fboH = cv.height;
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texS);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fboW, fboH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texS, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  var resize = function () {
    var dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.max(2, cv.clientWidth * dpr | 0);
    cv.height = Math.max(2, cv.clientHeight * dpr | 0);
  };
  resize(); addEventListener('resize', resize);

  /* dials - live via window.__hero.set */
  /* v14 train-reel treatment (frame-prototyped): silver-noir B&W —
     dense blacks, soft silver shoulder, halation felt-not-seen, a light
     sweep you can actually SEE, no DOF wash, CA at a whisper. */
  /* v15 "enhance, don't transform" — live-tuned in the browser against
     the footage's own theme: original tones preserved (EXP 1.35 offsets
     the ACES midtone dip), CA visible but tasteful, whisper of light
     sweep, halation + streaks + fine grain. No DOF, no B&W grade. */
  /* v16 "bold print" — live-tuned against the source stills: richer
     blacks (mild density contrast .14 + crush .012 in pass B), luminous
     windows (hal .22, streak .35), a touch more sculpt, EXP 1.28. */
  /* v17 "long exposure" — the cinematic rebuild. Faster reel (clips 1+3
     at 1.45x). Four new optical layers: normal-map REFRACTION (uDistort,
     the relief warps the image), cinema-prime EDGE DEFOCUS (uEdgeB/uEdgeS,
     centre stays razor sharp), wide thresholded HALATION (uGlow, only the
     bright windows bloom), and a silver-print grade (uDesat toward luma,
     deeper vignette uVig, coarse luma-weighted grain). */
  var DIFF = .14, SPEC = .22, SPECPOW = 50., ANISO = .50, RIM = 0.,
      GRAIN = .032, ORBIT = .22, ELEV = .55,
      CLAR = .30, SOFT = .8, CAC = .0011, CA = .0036, STREAK = .50, HAL = .30,
      NAMP = 2.2, DET = .05, TILE = 6.0, SHEEN = 0., SHEENR = .38, EXP = 1.24,
      BLUR = 0., BOKEH = 4., FOCUSW = .11, FEATHER = .60, RACKA = 0., RACKS = .10,
      DISTORT = .006, EDGEB = 9., EDGES = .50, GLOW = .42, DESAT = .60, VIG = .74,
      BASEB = 1.7;

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
    if (o.grain != null) GRAIN = o.grain;
    if (o.orbit != null) ORBIT = o.orbit;
    if (o.elev != null) ELEV = o.elev;
    if (o.clar != null) CLAR = o.clar;
    if (o.soft != null) SOFT = o.soft;
    if (o.cac != null) CAC = o.cac;
    if (o.ca != null) CA = o.ca;
    if (o.streak != null) STREAK = o.streak;
    if (o.hal != null) HAL = o.hal;
    if (o.namp != null) NAMP = o.namp;
    if (o.det != null) DET = o.det;
    if (o.tile != null) TILE = o.tile;
    if (o.sheen != null) SHEEN = o.sheen;
    if (o.sheenr != null) SHEENR = o.sheenr;
    if (o.exp != null) EXP = o.exp;
    if (o.blur != null) BLUR = o.blur;
    if (o.bokeh != null) BOKEH = o.bokeh;
    if (o.focusw != null) FOCUSW = o.focusw;
    if (o.feather != null) FEATHER = o.feather;
    if (o.racka != null) RACKA = o.racka;
    if (o.racks != null) RACKS = o.racks;
    if (o.distort != null) DISTORT = o.distort;
    if (o.edgeb != null) EDGEB = o.edgeb;
    if (o.edges != null) EDGES = o.edges;
    if (o.glow != null) GLOW = o.glow;
    if (o.desat != null) DESAT = o.desat;
    if (o.vig != null) VIG = o.vig;
    if (o.baseb != null) BASEB = o.baseb;
    if (o.rate != null) { RATE = o.rate; vA.defaultPlaybackRate = RATE; vA.playbackRate = RATE; }
    if (o.phase != null) window.__hero.phase = o.phase;
    return { DIFF: DIFF, SPEC: SPEC, SPECPOW: SPECPOW, ANISO: ANISO, RIM: RIM,
             GRAIN: GRAIN, ORBIT: ORBIT, ELEV: ELEV, CLAR: CLAR, SOFT: SOFT,
             CAC: CAC, CA: CA, STREAK: STREAK, HAL: HAL, NAMP: NAMP, DET: DET,
             TILE: TILE, SHEEN: SHEEN, SHEENR: SHEENR, EXP: EXP,
             BLUR: BLUR, BOKEH: BOKEH, FOCUSW: FOCUSW, FEATHER: FEATHER,
             RACKA: RACKA, RACKS: RACKS, DISTORT: DISTORT, EDGEB: EDGEB,
             EDGES: EDGES, GLOW: GLOW, DESAT: DESAT, VIG: VIG, BASEB: BASEB,
             rate: vA.playbackRate };
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
    var zoom = 1.0 + .03 * (0.5 + 0.5 * Math.sin(t * .032));

    if (vA.readyState >= 2) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texV);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, vA); } catch (e) { flatVideo(); return; }
    }
    sizeFBO();

    /* -------- pass A: scene -> fbo -------- */
    gl.useProgram(pA);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(aPosA); gl.vertexAttribPointer(aPosA, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(UA.uA, 0);
    gl.uniform1i(UA.uW, 1);
    gl.uniform1f(UA.uDiff, DIFF);
    gl.uniform1f(UA.uSpec, SPEC);
    gl.uniform1f(UA.uSpecPow, SPECPOW);
    gl.uniform1f(UA.uAniso, ANISO);
    gl.uniform1f(UA.uRim, RIM);
    gl.uniform1f(UA.uClar, CLAR);
    gl.uniform1f(UA.uSoft, SOFT);
    gl.uniform1f(UA.uZoom, zoom);
    gl.uniform1f(UA.uCAc, CAC);
    gl.uniform1f(UA.uCA, CA);
    gl.uniform1f(UA.uStreak, STREAK);
    gl.uniform1f(UA.uHal, HAL);
    gl.uniform1f(UA.uNAmp, NAMP);
    gl.uniform1f(UA.uDet, DET);
    gl.uniform1f(UA.uSheen, SHEEN);
    gl.uniform1f(UA.uSheenR, SHEENR);
    gl.uniform1f(UA.uDistort, DISTORT);
    gl.uniform2f(UA.uRes, cv.width, cv.height);
    gl.uniform2f(UA.uTile, TILE * (cv.width / Math.max(cv.height, 1)), TILE);
    gl.uniform3f(UA.uL, Lx, Ly, el);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, cv.width, cv.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    /* -------- pass B: lens -> screen -------- */
    gl.useProgram(pB);
    gl.enableVertexAttribArray(aPosB); gl.vertexAttribPointer(aPosB, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(UB.uT, 2);
    gl.uniform1f(UB.uTime, t);
    gl.uniform1f(UB.uBlur, BLUR);
    gl.uniform1f(UB.uBokeh, BOKEH);
    gl.uniform1f(UB.uFocusW, FOCUSW);
    gl.uniform1f(UB.uFeather, FEATHER);
    gl.uniform1f(UB.uRackA, RACKA);
    gl.uniform1f(UB.uRackS, RACKS);
    gl.uniform1f(UB.uExp, EXP);
    gl.uniform1f(UB.uEdgeB, EDGEB);
    gl.uniform1f(UB.uEdgeS, EDGES);
    gl.uniform1f(UB.uGlow, GLOW);
    gl.uniform1f(UB.uDesat, DESAT);
    gl.uniform1f(UB.uVig, VIG);
    gl.uniform1f(UB.uBaseB, BASEB);
    gl.uniform1f(UB.uGrain, GRAIN);
    gl.uniform1f(UB.uGrainT, now * .001);
    gl.uniform1f(UB.uRM, RM ? 1 : 0);
    gl.uniform2f(UB.uRes, cv.width, cv.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, cv.width, cv.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (vA.readyState >= 2) firstFrame = true;

    if (RM && firstFrame) { vA.pause(); run = false; }
  }
  (function pump (now) { requestAnimationFrame(pump); render(now || 0); })(0);
  setInterval(function () { var n = performance.now(); if (n - lastPump > 700) render(n); }, 500);
})();
