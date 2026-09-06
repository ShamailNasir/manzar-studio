/* ============================================================
   MANZAR SOUND — one engine, two identities.

   Ambience: each page carries an <audio data-mz-ambience> holding five
   scores for its world, served from this repo. Studio runs the warm,
   piano-led set (Midvinter, Moonlight, Castles in the Sky, Reawakening,
   At the End of All Things); Labs runs the cooler, more spacious one
   (Adrift Among Infinite Stars, The Long Dark, Cirrus, Hymn to the
   Dawn, Decoherence). All ten are Scott Buckley, CC BY 4.0 — credited
   in the footer and named in the toast as they are switched. Keys 1-5
   pick one, M cycles, and the choice is remembered per world.

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
  /* ---- A FRAMED PAGE IS SCENERY, NOT A VISIT ----------------------
     index.html shows the real Labs page inside .lp-frame, and Labs
     shows the real Studio page inside .rp-frame. Both are live
     documents, so both were loading this engine a second time — and
     that second copy started ITS world's score straight over the top of
     the host's. Two beds at once, in both directions, plus a second set
     of 1-5 keys and a second toast fighting for the same corner.

     A document that is not the top document plays nothing at all. It is
     a picture of a page; pictures do not have a soundtrack. The class
     is for the stylesheet, which hides the fixed sound chrome that
     would otherwise float inside the preview plate. */
  var framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  if (framed) {
    document.documentElement.classList.add('is-framed');
    var q = document.querySelector('audio[data-mz-ambience]');
    if (q) { try { q.pause(); q.removeAttribute('src'); q.load(); } catch (e) {} }
    return;
  }

  /* ---- the one exemption that needs no click ----------------------
     Chrome lets an INSTALLED site autoplay audible sound outright: no
     gesture, no engagement score, from the first second of every visit.
     To be installable a site needs a manifest and a service worker with
     a fetch handler, so the site now ships both (see sw.js, which
     deliberately caches nothing). Once the visitor hits Install in
     Chrome's address bar the score simply plays, for good.

     https only: file:// has no service workers, and there is nothing to
     gain by registering one against a local preview server. */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  var btns = Array.prototype.slice.call(document.querySelectorAll('[data-mz-sound]'));
  var amb = document.querySelector('audio[data-mz-ambience]');
  if (!btns.length && !amb) return;

  var KEY = 'mz:sound';
  var on = false;
  var ctx = null, uiGain = null;
  var raf = 0;
  var AMB_VOL = amb ? parseFloat(amb.getAttribute('data-mz-volume') || '0.45') : 0;

  /* ---- audition tracks (v22): each page may carry several score
     options; keys 1..n pick one, M cycles, the choice is remembered
     per brand so it follows you across pages. ---- */
  var BRAND = amb ? (amb.getAttribute('data-mz-brand') || 'site') : 'site';
  /* v2 of the key: the Studio running order changed (Moonlight moved to
     first), so an index saved against the old order would silently pick
     the wrong piece. A new key starts everyone on the new default and
     keeps their own choice from there. */
  var TKEY = 'mz:track2:' + BRAND;
  var tracks = [];
  try { tracks = JSON.parse(amb && amb.getAttribute('data-mz-tracks') || '[]'); } catch (e) {}
  var ti = 0;
  try { ti = Math.max(0, Math.min(tracks.length - 1, parseInt(localStorage.getItem(TKEY) || '0', 10) || 0)); } catch (e) {}
  if (amb && tracks.length) amb.setAttribute('src', tracks[ti].src);

  /* ---- the score does not restart when you change page ----
     Every navigation inside a world is a fresh document with a fresh
     <audio>, so the bed used to snap back to 0:00 every time you opened
     the archive or a capability page. The position is checkpointed into
     sessionStorage (same tab, cleared when the tab closes) and picked up
     on the way in, so the music carries across the whole visit. Only a
     matching track resumes, and only if the checkpoint is fresh — a tab
     left open for an hour starts over rather than jumping mid-phrase. */
  var PKEY = 'mz:pos:' + BRAND;
  var RESUME_MAX_AGE = 5 * 60 * 1000;

  function savePos () {
    if (!amb || !isFinite(amb.currentTime) || amb.currentTime < 0.5) return;
    try {
      sessionStorage.setItem(PKEY, JSON.stringify({
        i: ti, t: amb.currentTime, at: Date.now()
      }));
    } catch (e) {}
  }
  function clearPos () { try { sessionStorage.removeItem(PKEY); } catch (e) {} }

  var mark = 0, markDone = false;
  /* Applying the checkpoint is a race: setting src starts the media load
     algorithm, and currentTime cannot be set until metadata is in. One
     listener is not enough — the event can fire before the listener is
     attached, and a seek can be undone by the load that follows. So this
     is idempotent and called from everywhere it could possibly be the
     right moment: on metadata, on canplay, and immediately before the
     first successful play(). */
  function applyMark () {
    if (markDone || mark <= 0 || !amb) return;
    if (amb.readyState < 1 || !isFinite(amb.duration)) return;
    if (mark >= amb.duration - 1) { markDone = true; return; }
    try { amb.currentTime = mark; markDone = true; } catch (e) {}
  }

  if (amb) {
    try {
      var mk = JSON.parse(sessionStorage.getItem(PKEY) || 'null');
      if (mk && mk.i === ti && (Date.now() - mk.at) < RESUME_MAX_AGE) {
        mark = mk.t || 0;
      }
    } catch (e) {}
    if (mark > 0) {
      amb.addEventListener('loadedmetadata', applyMark);
      amb.addEventListener('canplay', applyMark);
      applyMark();
    }
    /* pagehide covers navigation and bfcache; the interval covers the
       cases where neither fires (a crash, a hard reload on some builds) */
    addEventListener('pagehide', savePos);
    addEventListener('beforeunload', savePos);
    setInterval(savePos, 4000);
  }

  function ensureCtx () {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    uiGain = ctx.createGain();
    uiGain.gain.value = 1.3;   /* everything up 30% by request */
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
    voice(1350, 900, 0.045, 0.09);
  }
  function sClick () {
    voice(210, 120, 0.09, 0.17);
    voice(2200, null, 0.025, 0.055, 'triangle');
  }
  function sOn () {
    voice(440, null, 0.35, 0.11);
    setTimeout(function () { voice(659.3, null, 0.4, 0.1); }, 90);
  }

  /* ---- ambience fades ---- */
  function fadeAmb (to, then) {
    if (!amb) { if (then) then(); return; }
    /* interval, not rAF: rAF freezes in background tabs and the fade
       would strand the volume at 0 */
    clearInterval(raf);
    var from = amb.volume, t0 = performance.now();
    raf = setInterval(function () {
      var k = Math.min((performance.now() - t0) / 1200, 1);
      amb.volume = from + (to - from) * k;
      if (k >= 1) { clearInterval(raf); if (then) then(); }
    }, 40);
  }
  /* play() returns a promise, and whether it resolves is the whole
     question: a browser rejects it until the origin has been interacted
     with. Callers need that answer, so it is handed back rather than
     swallowed. */
  function playAmb (then) {
    if (!amb) { if (then) then(false); return; }
    applyMark();          /* last chance to land on the checkpoint */
    var p;
    try { p = amb.play(); } catch (e) { if (then) then(false); return; }
    if (p && p.then) {
      p.then(function () { if (then) then(true); },
             function () { if (then) then(false); });
    } else if (then) { then(true); }
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
    if (!v) {
      audible = false;
      detachKick();
      fadeAmb(0, function () { if (amb) amb.pause(); });
      return;
    }
    ensureCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (chime) sOn();
    if (!amb) return;
    /* Armed before anything is attempted, and armed even when the tab is
       hidden. A gesture can easily land before a play() promise settles,
       and a tab that loads in the background becomes visible later — the
       previous version returned early in that case and never attached a
       listener at all, so a page opened in a background tab stayed
       silent for the rest of its life however much you clicked it. */
    armKick();
    if (document.hidden) { amb.volume = AMB_VOL; return; }
    beginAmbience();
  }

  /* Audible first: on an origin the visitor has used before this simply
     works and nothing else runs. Otherwise the score starts muted, which
     is always permitted, and waits for a gesture to unmute — by which
     point it is loaded, decoding and in the right place in the piece. */
  function beginAmbience () {
    if (!amb || !on || document.hidden) return;
    /* Kill any fade still in flight. Turning sound off starts a 1.2s
       fade whose callback pauses the element at the end of it; turning
       it straight back on used to leave that callback armed, and a
       second later it paused the score that had just started. The
       audible path happens to cancel it by starting a fade of its own —
       the muted preroll does not fade, so it never did. */
    clearInterval(raf);
    amb.muted = false;
    amb.volume = 0;
    playAmb(function (ok) {
      if (ok && !amb.muted) {
        audible = true;
        fadeAmb(AMB_VOL);
        detachKick();
        return;
      }
      prerollMuted();   /* running, silent, one property away from sound */
      armHint();
    });
  }
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener('click', function (e) {
      e.stopPropagation();
      setOn(!on, !on);
    });
  }

  /* ---- STARTING THE SCORE ------------------------------------------

     What a browser will and will not do, exactly:

       · Audible playback needs either a real user gesture on the
         document, or enough prior engagement with the ORIGIN that the
         browser has decided to trust it. Chrome calls the second one
         the Media Engagement Index.
       · MUTED playback is always allowed, with no gesture at all.
       · A synthetic event — dispatchEvent(new MouseEvent('click')) —
         carries isTrusted:false and grants no activation whatsoever.
         There is no way to fake a gesture from page script; that is the
         whole point of the flag. Anything claiming otherwise is either
         out of date or describing a browser flag.
       · A file:// page never accrues engagement, so opened straight off
         the disk it will ALWAYS want one gesture. Served from an origin
         — localhost included — it starts on its own after a few visits.
         Run "Preview Manzar Studio.cmd" in the project root and this
         stops being a question; see tools/README-preview.md.

     So this does the two things that are actually available:

     1. It tries audible first. On an origin the visitor has used
        before, that simply works and nothing else here runs.

     2. If the browser refuses, the score starts MUTED — which is
        always permitted — and keeps running. It is therefore already
        loaded, already decoding and already at the right point in the
        piece. The first gesture only has to flip .muted, which is
        instant: no fetch, no seek, no half-second of silence before the
        music arrives. That is the difference this makes, and it is the
        whole of what is possible in-page.

     The listeners stay attached until sound is genuinely audible —
     the old version detached them the moment they fired, so one early
     event the browser did not count as activation burned the only
     chance and the page stayed silent for the rest of the visit. */

  /* every event type Chrome counts as activation-triggering, plus the
     ones other engines count; wheel and mousemove are deliberately NOT
     here, because they grant nothing and would only fire pointlessly */
  var GESTURES = ['pointerdown', 'pointerup', 'mousedown', 'mouseup',
                  'touchstart', 'touchend', 'keydown', 'keyup', 'click'];

  var audible = false;      // has the score actually been heard yet

  function detachKick() {
    for (var i = 0; i < GESTURES.length; i++) {
      removeEventListener(GESTURES[i], kick, true);
    }
  }
  /* Muted, but running. Always permitted, so this is the state the page
     lands in whenever the browser will not give us sound yet. */
  function prerollMuted() {
    if (!amb || audible) return;
    amb.muted = true;
    amb.volume = AMB_VOL;
    var p;
    try { p = amb.play(); } catch (e) { return; }
    if (p && p['catch']) p['catch'](function () {});
  }
  /* The first gesture. The element is already playing, so this is a
     property flip and a fade — not a start. */
  var kick = function () {
    if (!on || !amb || document.hidden) return;
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (amb.muted) {
      amb.muted = false;
      amb.volume = 0;
      fadeAmb(AMB_VOL);
    }
    playAmb(function (ok) {
      if (!ok || amb.muted) return;
      audible = true;
      detachKick();
      clearTimeout(hintT);
      if (toast) toast.classList.remove('is-in');
    });
  };
  function armKick() {
    for (var g = 0; g < GESTURES.length; g++) {
      addEventListener(GESTURES[g], kick, true);
    }
  }

  /* If the browser has refused, say so once — quietly, in the toast the
     score switcher already uses, and only after a beat, so it never
     appears on the visits where autoplay simply works. */
  var hintT = 0, hinted = false;
  function armHint() {
    clearTimeout(hintT);
    hintT = setTimeout(function () {
      if (hinted || !on || !amb || audible || document.hidden) return;
      hinted = true;
      showToast('Sound on — click anywhere to start');
    }, 1600);
  }

  /* Sound is on by default; only an explicit mute ('0') is respected. */
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved !== '0') setOn(true, false);

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

  /* ---- audition switcher: 1..n select, M cycles ---- */
  var toast = null, toastT = 0;
  function showToast (txt) {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'mz-toast';
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = txt;
    toast.classList.add('is-in');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove('is-in'); }, 1900);
  }
  function switchTo (i) {
    if (!amb || !tracks.length) return;
    i = ((i % tracks.length) + tracks.length) % tracks.length;
    showToast((i + 1) + ' / ' + tracks.length + ' — ' + tracks[i].name);
    if (i === ti) return;
    ti = i;
    try { localStorage.setItem(TKEY, String(ti)); } catch (e) {}
    clearPos();   /* a new score starts at the top, not mid-phrase */
    mark = 0; markDone = true;
    var go = function () {
      amb.setAttribute('src', tracks[ti].src);
      amb.load();
      if (on && !document.hidden) { amb.volume = 0; playAmb(); fadeAmb(AMB_VOL); }
      else amb.volume = AMB_VOL;
    };
    if (on && !amb.paused) fadeAmb(0, go); else go();
  }
  if (tracks.length > 1) {
    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'm' || e.key === 'M') { switchTo(ti + 1); return; }
      var d = parseInt(e.key, 10);
      if (d >= 1 && d <= tracks.length) switchTo(d - 1);
    });
  }

  /* courtesy: silence with the tab, return with it */
  document.addEventListener('visibilitychange', function () {
    if (!on || !amb) return;
    if (document.hidden) { amb.pause(); return; }
    /* coming back: resume if it was already audible, otherwise run the
       whole ladder again — this is the first real chance a tab that
       loaded in the background has had */
    if (audible) playAmb(); else beginAmbience();
  });

  paint();
})();
