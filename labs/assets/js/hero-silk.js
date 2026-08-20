/* ============================================================
   LABS HERO - charcoal silk, shot on glass          (engine v6)
   ============================================================
   Two-pass pipeline, the way real post stacks are built:

   PASS A - the scene (renders into a framebuffer)
     - one atlas video: footage on top, its baked normal strip
       beneath (1920x1620). One element, one clock: the lighting
       cannot fall out of step with the cloth at the loop.
     - the baked normals arrive nearly flat (measured: mean surface
       tilt 3.2deg), so they are amplified in-shader (uNAmp), then a
       tileable silk-weave DETAIL normal map (satin float pattern +
       anisotropic fibre noise, mean tilt 29deg - real-fabric
       amplitude) is layered on with the whiteout blend
       [Barre-Brisebois & Hill, "Blending in Detail"].
     - lighting: wrap diffuse from a cool orbiting key; a warm
       counter-fill answering from the opposite side; CHARLIE SHEEN
       cloth specular [Estevez & Kulla 2017, "Production Friendly
       Microfacet Sheen BRDF" - the silk/velvet distribution used by
       Sony Imageworks and Google Filament]; an anisotropic streak
       highlight for the thread-direction gleam; thin-film
       IRIDESCENCE tinting the sheen through a cosine spectral
       palette; a silver rim.
     - a gentle 5-tap pre-soften melts codec artefacts before any
       light touches them. Gate weave + breathing zoom live here.

   PASS B - the glass (framebuffer -> screen)
     - SPECTRAL DISPERSION across the whole frame: six taps splayed
       along a blended radial/diagonal axis, each tap feeding one of
       six colour channels (r y g c b v - the RGB->rygcbv Fourier
       expansion, Sundararaman; popularised by junni.co.jp). A centre
       floor (uCAc) guarantees fringing in the MIDDLE of the frame,
       and a radial term (uCAr*r^2) grows it toward the corners.
       Every tap is Poisson-jittered (uSoft2), so the dispersion is
       also the dreamy soften.
     - anamorphic streak bloom and halation, now sampling the LIT
       image, so the light itself blooms.
     - luminance resaturation (the multi-tap smear desaturates;
       this buys it back), filmic S-curve over a lifted toe,
       vignette, fine animated grain.

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
  /* load() resets playbackRate; pin it via default AND re-assert. */
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
    'uniform float uNAmp, uDet, uDiff, uFill, uSheen, uSheenR, uSpec, uSpecPow, uAniso;',
    'uniform float uIrid, uIridF, uRim, uSoft, uZoom, uWeaveT;',
    'uniform vec2 uRes, uTile;',
    'uniform vec3 uL, uFillL;',
    'const vec2 VRES = vec2(1920., 1080.);',
    'const float PI = 3.14159265;',
    'float lum(vec3 c){ return dot(c, vec3(.299,.587,.114)); }',
    /* atlas: with FLIP_Y uploads, colour lives at tex v in [1/3,1],
       the normal strip at [0,1/3]. */
    'vec2 cuv(vec2 uv){ return vec2(uv.x, mix(1./3., 1., clamp(uv.y, 0., 1.))); }',
    'vec2 nuv(vec2 uv){ return vec2(uv.x, mix(0., 1./3., clamp(uv.y, 0., 1.))); }',
    'vec3 vid(vec2 uv){ return texture2D(uA, cuv(uv)).rgb; }',
    /* Estevez & Kulla 2017 - the cloth sheen distribution */
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
    '  st += vec2(sin(uWeaveT * 1.7), cos(uWeaveT * 1.3)) * .00032;',
    '  vec2 uv = st + .5;',
    /* pre-soften: 5 taps, melts codec blocking before the light */
    '  vec2 sx = uSoft / VRES;',
    '  vec3 col = vid(uv) * .40',
    '           + vid(uv + sx) * .15 + vid(uv - sx) * .15',
    '           + vid(uv + vec2(sx.x, -sx.y)) * .15 + vid(uv + vec2(-sx.x, sx.y)) * .15;',
    '  float l0 = lum(col);',
    /* normals: amplified base + whiteout-blended weave detail */
    '  vec3 nb = texture2D(uA, nuv(uv)).rgb * 2. - 1.;',
    '  nb.xy *= uNAmp; nb = normalize(nb);',
    /* weave detail: rotated 30deg so the thread grid never aligns with
       the anisotropic axis (aligned it reads as scanlines), and weighted
       into the lit crests - fabric shows its weave in the sheen. */
    '  vec2 wuv = uv * uTile;',
    '  wuv = mat2(.866, -.5, .5, .866) * wuv;',
    '  vec3 nd = texture2D(uW, wuv).rgb * 2. - 1.;',
    '  float dk = uDet * (.3 + .7 * smoothstep(.05, .35, l0));',
    '  nd = normalize(mix(vec3(0., 0., 1.), nd, dk));',
    '  vec3 N = normalize(vec3(nb.xy + nd.xy, nb.z * nd.z));',
    '  vec3 L = normalize(uL);',
    '  vec3 FL = normalize(uFillL);',
    '  vec3 V = vec3(0., 0., 1.);',
    /* cool key: wrap diffuse - the breath of the light */
    '  float d = clamp(dot(N, L) * .5 + .5, 0., 1.);',
    '  d = pow(d, 1.35);',
    '  col *= mix(1. - uDiff * .55, 1. + uDiff * .85, d);',
    /* warm counter-fill answering from the far side */
    '  float fd = clamp(dot(N, FL) * .5 + .5, 0., 1.); fd *= fd;',
    '  col += vec3(1.05, .93, .78) * fd * uFill * smoothstep(.02, .2, l0);',
    /* Charlie sheen - the broad silk lustre */
    '  vec3 H = normalize(L + V);',
    '  float NoH = max(dot(N, H), 0.);',
    '  float NoL = max(dot(N, L), 0.);',
    '  float NoV = max(N.z, 0.);',
    '  float Dc = D_Charlie(uSheenR, NoH);',
    '  float Vn = 1. / (4. * (NoL + NoV - NoL * NoV) + 1e-4);',
    '  float sheen = Dc * Vn * NoL;',
    /* anisotropic streak - thread-direction gleam */
    '  vec3 Na = normalize(N * vec3(uAniso, 1., 1.));',
    '  float sa = pow(max(dot(Na, H), 0.), uSpecPow);',
    /* thin-film iridescence tints the sheen */
    '  float fr = pow(1. - NoV, 2.);',
    '  vec3 irid = .5 + .5 * cos(6.28318 * (uIridF * fr + vec3(0., .33, .67)));',
    '  vec3 shc = mix(vec3(.94, .96, 1.02), irid, uIrid);',
    '  float crest = smoothstep(.03, .26, l0);',
    '  col += shc * (sheen * uSheen + sa * uSpec) * crest;',
    /* silver rim off the steep folds */
    '  float rim = pow(1. - abs(N.z), 2.4);',
    '  col += vec3(.9, .93, 1.) * rim * uRim * crest;',
    '  gl_FragColor = vec4(col, 1.);',
    '}',
  ].join('\n');

  /* ---------------- PASS B: the glass ---------------- */
  var FSB = [
    'precision highp float; varying vec2 vUv;',
    'uniform sampler2D uT;',
    'uniform float uCAc, uCAr, uSoft2, uStreak, uHal, uLift, uCurve, uSat, uGrain, uGrainT, uRM;',
    'uniform vec2 uRes;',
    'float lum(vec3 c){ return dot(c, vec3(.299,.587,.114)); }',
    'vec3 sat(vec3 rgb, float k){',
    '  return mix(vec3(dot(rgb, vec3(.2125, .7154, .0721))), rgb, k);',
    '}',
    'void main(){',
    '  vec2 uv = vUv;',
    '  float asp = uRes.x / uRes.y;',
    '  vec2 pc = vUv - .5; pc.x *= asp;',
    '  float r2 = dot(pc, pc);',
    /* dispersion axis: diagonal at centre, bending radial outward */
    '  vec2 dir = normalize(pc + vec2(.33, -.21));',
    '  float amt = uCAc + uCAr * r2;',
    /* six taps -> six spectral channels (r y g c b v), Poisson-jittered.
       RGB->rygcbv expansion and its inverse are Sundararaman's Fourier
       interpolation; six planes make the smear a smooth rainbow. */
    '  vec3 s0 = texture2D(uT, uv + dir * amt * -.50 + vec2( .94,  .28) * uSoft2).rgb;',
    '  vec3 s1 = texture2D(uT, uv + dir * amt * -.30 + vec2(-.40,  .87) * uSoft2).rgb;',
    '  vec3 s2 = texture2D(uT, uv + dir * amt * -.10 + vec2(-.87, -.44) * uSoft2).rgb;',
    '  vec3 s3 = texture2D(uT, uv + dir * amt *  .10 + vec2( .33, -.91) * uSoft2).rgb;',
    '  vec3 s4 = texture2D(uT, uv + dir * amt *  .30 + vec2( .74, -.60) * uSoft2).rgb;',
    '  vec3 s5 = texture2D(uT, uv + dir * amt *  .50 + vec2(-.24,  .53) * uSoft2).rgb;',
    '  float r = s0.r * .5;',
    '  float y = (2. * s1.r + 2. * s1.g - s1.b) / 6.;',
    '  float g = s2.g * .5;',
    '  float c = (2. * s3.g + 2. * s3.b - s3.r) / 6.;',
    '  float b = s4.b * .5;',
    '  float v = (2. * s5.b + 2. * s5.r - s5.g) / 6.;',
    '  vec3 col;',
    '  col.r = r + (2. * v + 2. * y - c) / 3.;',
    '  col.g = g + (2. * y + 2. * c - v) / 3.;',
    '  col.b = b + (2. * c + 2. * v - y) / 3.;',
    '  col = max(col, 0.);',
    /* anamorphic streak: lit highlights bleed sideways */
    '  float px = 1. / uRes.x;',
    '  float bp = 0.;',
    '  bp += max(lum(texture2D(uT, uv + vec2(px *  4., 0.)).rgb) - .32, 0.) * .30;',
    '  bp += max(lum(texture2D(uT, uv - vec2(px *  4., 0.)).rgb) - .32, 0.) * .30;',
    '  bp += max(lum(texture2D(uT, uv + vec2(px *  9., 0.)).rgb) - .32, 0.) * .21;',
    '  bp += max(lum(texture2D(uT, uv - vec2(px *  9., 0.)).rgb) - .32, 0.) * .21;',
    '  bp += max(lum(texture2D(uT, uv + vec2(px * 16., 0.)).rgb) - .32, 0.) * .12;',
    '  bp += max(lum(texture2D(uT, uv - vec2(px * 16., 0.)).rgb) - .32, 0.) * .12;',
    '  col += vec3(.9, .95, 1.06) * bp * uStreak;',
    /* halation: emulsion glow around the hot folds */
    '  vec2 hx = vec2(7.) / uRes;',
    '  float hl = 0.;',
    '  hl += max(lum(texture2D(uT, uv + hx).rgb) - .34, 0.);',
    '  hl += max(lum(texture2D(uT, uv - hx).rgb) - .34, 0.);',
    '  hl += max(lum(texture2D(uT, uv + vec2(hx.x, -hx.y)).rgb) - .34, 0.);',
    '  hl += max(lum(texture2D(uT, uv + vec2(-hx.x, hx.y)).rgb) - .34, 0.);',
    '  col += vec3(1.03, 1., .97) * hl * .25 * uHal;',
    /* the grade */
    '  col = sat(col, uSat);',
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

  /* unit 1: silk-weave detail normal (tileable, mipmapped) */
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

  /* unit 2 + framebuffer: the scene target for pass B */
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
  var DIFF = .34, SPEC = .30, SPECPOW = 90., ANISO = .42, RIM = .08,
      LIFT = .55, GRAIN = .032, ORBIT = .10, ELEV = .58,
      CURVE = .34, STREAK = .45, HAL = .5,
      NAMP = 2.6, DET = .26, TILE = 6.0, SHEEN = .42, SHEENR = .38,
      IRID = .5, IRIDF = 1.6, FILL = .12,
      SOFT = 1.1, CAC = .0022, CAR = .0035, SOFT2 = .0013, SAT = 1.12;

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
    if (o.curve != null) CURVE = o.curve;
    if (o.streak != null) STREAK = o.streak;
    if (o.hal != null) HAL = o.hal;
    if (o.namp != null) NAMP = o.namp;
    if (o.det != null) DET = o.det;
    if (o.tile != null) TILE = o.tile;
    if (o.sheen != null) SHEEN = o.sheen;
    if (o.sheenr != null) SHEENR = o.sheenr;
    if (o.irid != null) IRID = o.irid;
    if (o.iridf != null) IRIDF = o.iridf;
    if (o.fill != null) FILL = o.fill;
    if (o.soft != null) SOFT = o.soft;
    if (o.cac != null) CAC = o.cac;
    if (o.car != null) CAR = o.car;
    if (o.ca != null) CAR = o.ca;
    if (o.soft2 != null) SOFT2 = o.soft2;
    if (o.sat != null) SAT = o.sat;
    if (o.rate != null) { RATE = o.rate; vA.defaultPlaybackRate = RATE; vA.playbackRate = RATE; }
    if (o.phase != null) window.__hero.phase = o.phase;
    return { DIFF: DIFF, SPEC: SPEC, SPECPOW: SPECPOW, ANISO: ANISO, RIM: RIM, LIFT: LIFT,
             GRAIN: GRAIN, ORBIT: ORBIT, ELEV: ELEV, CURVE: CURVE, STREAK: STREAK, HAL: HAL,
             NAMP: NAMP, DET: DET, TILE: TILE, SHEEN: SHEEN, SHEENR: SHEENR,
             IRID: IRID, IRIDF: IRIDF, FILL: FILL, SOFT: SOFT,
             CAC: CAC, CAR: CAR, SOFT2: SOFT2, SAT: SAT, rate: vA.playbackRate };
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
    gl.uniform1f(UA.uNAmp, NAMP);
    gl.uniform1f(UA.uDet, DET);
    gl.uniform1f(UA.uDiff, DIFF);
    gl.uniform1f(UA.uFill, FILL);
    gl.uniform1f(UA.uSheen, SHEEN);
    gl.uniform1f(UA.uSheenR, SHEENR);
    gl.uniform1f(UA.uSpec, SPEC);
    gl.uniform1f(UA.uSpecPow, SPECPOW);
    gl.uniform1f(UA.uAniso, ANISO);
    gl.uniform1f(UA.uIrid, IRID);
    gl.uniform1f(UA.uIridF, IRIDF);
    gl.uniform1f(UA.uRim, RIM);
    gl.uniform1f(UA.uSoft, SOFT);
    gl.uniform1f(UA.uZoom, zoom);
    gl.uniform1f(UA.uWeaveT, now * .001);
    gl.uniform2f(UA.uRes, cv.width, cv.height);
    gl.uniform2f(UA.uTile, TILE * (cv.width / Math.max(cv.height, 1)), TILE);
    gl.uniform3f(UA.uL, Lx, Ly, el);
    gl.uniform3f(UA.uFillL, -Lx, -Ly * .8, .35);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, cv.width, cv.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    /* -------- pass B: fbo -> screen -------- */
    gl.useProgram(pB);
    gl.enableVertexAttribArray(aPosB); gl.vertexAttribPointer(aPosB, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(UB.uT, 2);
    gl.uniform1f(UB.uCAc, CAC);
    gl.uniform1f(UB.uCAr, CAR);
    gl.uniform1f(UB.uSoft2, SOFT2);
    gl.uniform1f(UB.uStreak, STREAK);
    gl.uniform1f(UB.uHal, HAL);
    gl.uniform1f(UB.uLift, LIFT);
    gl.uniform1f(UB.uCurve, CURVE);
    gl.uniform1f(UB.uSat, SAT);
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
