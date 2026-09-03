/* ============================================================
   MANZAR SOUND — one engine, two identities.

   Ambience: each page carries an <audio data-mz-ambience> pointing
   at its brand bed — Labs gets the underground (the hero clip's own
   station recording + sub drone + hall air, reverb-glued), Studio
   gets the dunes (real wind from the dune footage + a warm detuned
   pad + sparse struck tones). Both files are loop-baked offline
   (tail crossfaded into head) so they can run forever seamlessly.

   UI sounds: synthesized in Web Audio at the moment of interaction —
   no files, no network, no latency, and file://-safe. A soft blip of
   air on hover, a low felt "thock" on click, a two-note chime when
   sound comes on. Volumes sit far under the ambience: the goal is
   furniture you feel, not effects you notice.

   State: one toggle (all [data-mz-sound] buttons mirror it),
   remembered in localStorage. Autoplay policy requires a gesture,
   so a remembered "on" arms itself and begins on the first
   pointer/keyboard gesture — the Monolog pattern.
   ============================================================ */
(function () {
  var btns = Array.prototype.slice.call(document.querySelectorAll('[data-mz-sound]'));
  var amb = document.querySelector('audio[data-mz-ambience]');
  if (!btns.length && !amb) return;

  var KEY = 'mz:sound';
  var on = false;
  var ctx = null, uiGain = null;
  var raf = 0;
  var AMB_VOL = amb ? parseFloat(amb.getAttribute('data-mz-volume') || '0.45') : 0;

  function ensureCtx () {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    uiGain = ctx.createGain();
    uiGain.gain.value = 0.6;
    uiGain.connect(ctx.destination);
    return true;
  }

  /* ---- synthesized UI voices ---- */
  function voice (freq, bendTo, dur, vol, type) {
    if (!on || !ensureCtx()) return;
    if (ctx.state === 'suspended') ctx.resume();
    var t0 = ctx.currentTime;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (bendTo) o.frequency.exponentialRampToValueAtTime(bendTo, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(uiGain);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }
  var lastHover = 0;
  function sHover () {
    var n = performance.now();
    if (n - lastHover < 90) return;   /* marquee rows can fire in bursts */
    lastHover = n;
    voice(1350, 900, 0.045, 0.035);
  }
  function sClick () {
    voice(210, 120, 0.09, 0.07);
    voice(2200, null, 0.025, 0.022, 'triangle');
  }
  function sOn () {
    voice(440, null, 0.35, 0.05);
    setTimeout(function () { voice(659.3, null, 0.4, 0.045); }, 90);
  }

  /* ---- ambience fades ---- */
  function fadeAmb (to, then) {
    if (!amb) { if (then) then(); return; }
    /* interval, not rAF: rAF freezes in background tabs and the fade
       would strand the volume at 0 */
    clearInterval(raf);
    var from = amb.volume, t0 = performance.now();
    raf = setInterval(function () {
      var k = Math.min((performance.now() - t0) / 700, 1);
      amb.volume = from + (to - from) * k;
      if (k >= 1) { clearInterval(raf); if (then) then(); }
    }, 40);
  }
  function playAmb () {
    if (!amb) return;
    var p = amb.play();
    if (p && p.catch) p.catch(function () {});
  }

  /* ---- one state, every button ---- */
  function paint () {
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('is-on', on);
      btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      btns[i].setAttribute('aria-label', (on ? 'Turn sound off' : 'Turn sound on'));
    }
  }
  function setOn (v, chime) {
    on = v;
    try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {}
    paint();
    if (v) {
      ensureCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume();
      if (amb) {
        if (document.hidden) { amb.volume = AMB_VOL; } /* start when visible */
        else { amb.volume = 0; playAmb(); fadeAmb(AMB_VOL); }
      }
      if (chime) sOn();
    } else {
      fadeAmb(0, function () { if (amb) amb.pause(); });
    }
  }
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener('click', function (e) {
      e.stopPropagation();
      setOn(!on, !on);
    });
  }

  /* remembered "on" arms itself; first gesture anywhere starts it */
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved === '1') {
    var arm = function () {
      removeEventListener('pointerdown', arm, true);
      removeEventListener('keydown', arm, true);
      setOn(true, false);
    };
    addEventListener('pointerdown', arm, true);
    addEventListener('keydown', arm, true);
  }

  /* ---- interaction sounds, delegated ---- */
  var SEL = 'a, button, summary, [role="button"], .mzx-row';
  document.addEventListener('pointerover', function (e) {
    if (!on) return;
    var el = e.target && e.target.closest ? e.target.closest(SEL) : null;
    if (el && (!e.relatedTarget || !el.contains(e.relatedTarget))) sHover();
  }, { passive: true });
  document.addEventListener('pointerdown', function (e) {
    if (!on) return;
    var el = e.target && e.target.closest ? e.target.closest(SEL) : null;
    if (el) sClick();
  }, { passive: true });

  /* courtesy: silence with the tab, return with it */
  document.addEventListener('visibilitychange', function () {
    if (!on || !amb) return;
    if (document.hidden) amb.pause(); else playAmb();
  });

  paint();
})();
