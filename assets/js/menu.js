/* ============================================================
   THE MENU  ·  behaviour
   ============================================================
   Self-contained on purpose. The previous menu was driven by
   MZ.menu() inside manzar-system.js, which the Studio page does not
   load — so Studio could not have the same menu. This has no
   dependencies, so every page runs the identical component.

   It also does not measure or scale anything. The old one sized the
   type to fill the sheet, which is what made it come out big, and the
   fit could never settle. Layout is CSS, full stop.

   Hooks, all data attributes:
     [data-mzx-open]     any element that opens it
     [data-mzx-close]    any element that closes it
     [data-media]        on a row: the frame to show while hovered
     [data-kicker]       on a row: the label above the caption
   ============================================================ */
(function () {
  "use strict";

  var panel = document.getElementById("mzxMenu");
  if (!panel) return;

  var frame   = panel.querySelector("[data-mzx-frame]");
  var kicker  = panel.querySelector("[data-mzx-kicker]");
  var caption = panel.querySelector("[data-mzx-caption]");
  var rows    = Array.prototype.slice.call(panel.querySelectorAll(".mzx-row"));
  var media   = panel.querySelector(".mzx-media");
  var open    = false;
  var lastFocus = null;

  /* ── the frame: two stacked <img>, alternated, so a change
        crossfades rather than blinking through white ───────── */
  var layers = frame ? Array.prototype.slice.call(frame.querySelectorAll("img")) : [];
  var front  = 0;
  var shownSrc = layers.length ? layers[0].getAttribute("src") : null;

  function showMedia(src, kick, cap) {
    if (!frame || !src || src === shownSrc) {
      if (kicker && kick) kicker.textContent = kick;
      if (caption && cap) caption.textContent = cap;
      return;
    }
    shownSrc = src;
    var next = layers[(front + 1) % layers.length];
    var cur  = layers[front];
    next.onload = function () {
      next.classList.add("is-on");
      cur.classList.remove("is-on");
      front = (front + 1) % layers.length;
    };
    /* if it is already cached, onload will not fire again */
    next.setAttribute("src", src);
    if (next.complete) next.onload();
    if (kicker && kick) kicker.textContent = kick;
    if (caption && cap) caption.textContent = cap;
  }

  var defSrc  = media && media.getAttribute("data-default-media");
  var defKick = media && media.getAttribute("data-default-kicker");
  var defCap  = media && media.getAttribute("data-default-caption");

  var restore;
  function bindRow(row) {
    function enter() {
      clearTimeout(restore);
      showMedia(row.getAttribute("data-media"),
                row.getAttribute("data-kicker"),
                (row.querySelector(".mzx-d") || {}).textContent);
    }
    function leave() {
      clearTimeout(restore);
      restore = setTimeout(function () {
        showMedia(defSrc, defKick, defCap);
      }, 260);
    }
    row.addEventListener("pointerenter", enter);
    row.addEventListener("focus", enter);
    row.addEventListener("pointerleave", leave);
    row.addEventListener("blur", leave);
  }
  rows.forEach(bindRow);

  /* preload every frame once, the first time the menu opens, so a
     hover never waits on the network */
  var warmed = false;
  function warm() {
    if (warmed) return;
    warmed = true;
    rows.forEach(function (r) {
      var s = r.getAttribute("data-media");
      if (s) { var i = new Image(); i.src = s; }
    });
  }

  /* ── open / close ─────────────────────────────────────────── */
  function focusables() {
    return Array.prototype.slice.call(panel.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(function (el) { return el.offsetParent !== null; });
  }

  function setOpen(next) {
    if (next === open) return;
    open = next;

    if (open) {
      lastFocus = document.activeElement;
      panel.hidden = false;
      warm();
      /* a frame between unhide and the class, so the transition runs */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { panel.classList.add("is-open"); });
      });
    } else {
      panel.classList.remove("is-open");
      /* keep it in the tree until the fade finishes, then take it out
         of the tab order entirely */
      setTimeout(function () { if (!open) panel.hidden = true; }, 460);
    }

    panel.setAttribute("aria-hidden", String(!open));
    document.documentElement.classList.toggle("mzx-lock", open);
    document.body.classList.toggle("mzx-lock", open);

    Array.prototype.forEach.call(document.querySelectorAll("[data-mzx-open]"), function (b) {
      b.setAttribute("aria-expanded", String(open));
    });

    /* Lenis, where a page uses it */
    var l = window.lenisInstance || window.lenis;
    if (l && typeof l.stop === "function") { open ? l.stop() : l.start(); }

    if (open) {
      var f = focusables();
      if (f.length) f[0].focus({ preventScroll: true });
      showMedia(defSrc, defKick, defCap);
    } else if (lastFocus && lastFocus.focus) {
      lastFocus.focus({ preventScroll: true });
    }
  }

  document.addEventListener("click", function (e) {
    var o = e.target.closest ? e.target.closest("[data-mzx-open]") : null;
    if (o) { e.preventDefault(); setOpen(!open); return; }
    var c = e.target.closest ? e.target.closest("[data-mzx-close]") : null;
    if (c) { e.preventDefault(); setOpen(false); }
  });

  /* a row that goes somewhere on this same page should close it */
  rows.forEach(function (r) {
    r.addEventListener("click", function () {
      var href = r.getAttribute("href") || "";
      if (href.charAt(0) === "#") setOpen(false);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (!open) return;
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key !== "Tab") return;
    var f = focusables();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* never leave it open across a history restore */
  window.addEventListener("pageshow", function () {
    if (open) { panel.classList.remove("is-open"); panel.hidden = true; open = false; }
    document.documentElement.classList.remove("mzx-lock");
    document.body.classList.remove("mzx-lock");
  });

  /* ── clocks ───────────────────────────────────────────────
     Implemented here rather than leaning on manzar-system.js, which
     the Studio page does not load. */
  /* data-mzx-clock, not data-clock: manzar-system.js also claims
     data-clock and writes HH:MM:SS into it, so both scripts were
     fighting over the same nodes and the footer showed ticking
     seconds. Own hook, own format. */
  var clocks = Array.prototype.slice.call(panel.querySelectorAll("[data-mzx-clock]"));
  if (clocks.length) {
    var tick = function () {
      clocks.forEach(function (el) {
        try {
          el.textContent = new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit", minute: "2-digit",
            hour12: false, timeZone: el.getAttribute("data-mzx-clock")
          }).format(new Date());
        } catch (err) { el.textContent = "--:--"; }
      });
    };
    tick();
    setInterval(tick, 20000);
  }
})();
