/* ═══════════════════════════════════════════════════════════
   MANZAR LABS — plate.js
   The live page, mapped onto a photographic machine.

   No WebGL. The machine is a still image, and the running site is a real
   iframe warped onto its screen with a projective transform, so what you
   see is a photograph with a working page inside it. That is both the
   cheapest and the most convincing way to do this: nothing procedural has
   to pretend to be hardware.

   To swap the machine, replace assets/img/machine-plate.png and update
   SCREEN below with the four corners of its screen, in fractions of the
   image (0-1), clockwise from the top-left. Everything else follows.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Corners of the screen in the plate, as fractions of the image,
     clockwise from the top-left. Measured off the plate by keying its
     magenta screen fill — that fill is why the machine is photographed
     with a flat magenta display in the first place. */
  var SCREEN = [
    [0.2472, 0.1719],
    [0.7525, 0.1719],
    [0.7525, 0.7663],
    [0.2472, 0.7656]
  ];

  var plate  = document.getElementById('plate');
  var img    = plate && plate.querySelector('.plate-img');
  var screen = document.getElementById('machScreen');
  if (!plate || !img || !screen) return;

  /* The page is authored at a fixed size and then warped, so its layout
     never depends on how big the plate happens to render. The height is
     derived from the measured quad rather than assumed, so a plate whose
     screen is not 16:10 cannot stretch the page inside it. */
  var PX_W = 1440, PX_H = 900;
  function measure() {
    var nw = img.naturalWidth || 2600, nh = img.naturalHeight || 1418;
    var top = Math.hypot((SCREEN[1][0] - SCREEN[0][0]) * nw, (SCREEN[1][1] - SCREEN[0][1]) * nh);
    var bot = Math.hypot((SCREEN[2][0] - SCREEN[3][0]) * nw, (SCREEN[2][1] - SCREEN[3][1]) * nh);
    var lft = Math.hypot((SCREEN[3][0] - SCREEN[0][0]) * nw, (SCREEN[3][1] - SCREEN[0][1]) * nh);
    var rgt = Math.hypot((SCREEN[2][0] - SCREEN[1][0]) * nw, (SCREEN[2][1] - SCREEN[1][1]) * nh);
    PX_H = Math.round(PX_W * ((lft + rgt) / (top + bot)));
    screen.style.width  = PX_W + 'px';
    screen.style.height = PX_H + 'px';
  }

  /* Solve the projective transform taking the screen's own box to the
     four corners it has to land on. Eight unknowns, eight equations —
     plain Gaussian elimination, no library. */
  function solve(A, b) {
    var n = b.length;
    for (var i = 0; i < n; i++) {
      var max = i;
      for (var r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[max][i])) max = r;
      var t = A[i]; A[i] = A[max]; A[max] = t;
      var tb = b[i]; b[i] = b[max]; b[max] = tb;
      if (!A[i][i]) return null;
      for (var r2 = i + 1; r2 < n; r2++) {
        var f = A[r2][i] / A[i][i];
        for (var c = i; c < n; c++) A[r2][c] -= f * A[i][c];
        b[r2] -= f * b[i];
      }
    }
    var x = new Array(n);
    for (var i2 = n - 1; i2 >= 0; i2--) {
      var sum = b[i2];
      for (var c2 = i2 + 1; c2 < n; c2++) sum -= A[i2][c2] * x[c2];
      x[i2] = sum / A[i2][i2];
    }
    return x;
  }

  function transform(dst) {
    var src = [[0, 0], [PX_W, 0], [PX_W, PX_H], [0, PX_H]];
    var A = [], b = [];
    for (var i = 0; i < 4; i++) {
      var s = src[i], d = dst[i];
      A.push([s[0], s[1], 1, 0, 0, 0, -s[0] * d[0], -s[1] * d[0]]); b.push(d[0]);
      A.push([0, 0, 0, s[0], s[1], 1, -s[0] * d[1], -s[1] * d[1]]); b.push(d[1]);
    }
    var h = solve(A, b);
    if (!h) return null;
    /* CSS matrix3d is column-major; the 3x3 homography drops in with the
       projective row becoming the fourth component of each column. */
    return 'matrix3d(' + [
      h[0], h[3], 0, h[6],
      h[1], h[4], 0, h[7],
      0, 0, 1, 0,
      h[2], h[5], 0, 1
    ].join(',') + ')';
  }

  function place() {
    var w = img.clientWidth, h = img.clientHeight;
    if (!w || !h) return;
    var m = transform(SCREEN.map(function (p) { return [p[0] * w, p[1] * h]; }));
    if (m) screen.style.transform = m;
  }

  function refresh() { measure(); place(); }
  if (img.complete) refresh(); else img.addEventListener('load', refresh);
  new ResizeObserver(refresh).observe(plate);
  window.addEventListener('orientationchange', refresh);
})();
