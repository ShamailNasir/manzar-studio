/* ══════════════════════════════════════════════════════════════════════
   MANZAR STUDIO — WORK
   ══════════════════════════════════════════════════════════════════════
   Builds the "Selected work" mosaic on the homepage and the whole of
   /work.html from the one list in work-data.js, and runs the player that
   both of them open.

   Plain ES5, no build step, no framework — the same rule the rest of
   this site follows. Everything degrades: if the CDN player script never
   arrives, the cards keep their posters and the lightbox falls back to
   the progressive MP4; if JavaScript is off entirely the section shows
   its <noscript> line rather than an empty hole.

   Bandwidth is the reason this file is as long as it is. The masters are
   10–35 MB each and there are 23 of them, and every card plays itself as
   soon as it is on screen — so nothing here ever loads an MP4 to fill a
   tile. Tiles stream the HLS rendition that matches the size they are
   drawn at, four at a time at most, and stop the moment they scroll
   away. Only the player streams the full ladder.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var MZ = window.MZ_WORK;
  if (!MZ) return;

  var HLS_CDN     = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js';
  var PREVIEW_CAP = 720;  // hard ceiling on a grid tile's short side
  var PLAY_MAX    = 6;    // clips playing at once on a wide screen
  var WARM_MAX    = 3;    // more, mounted and buffered but not playing
  var KEEP_ALIVE  = 20000;// ms a card that scrolled away keeps its player

  var REDUCED = false;
  try { REDUCED = matchMedia('(prefers-reduced-motion:reduce)').matches; } catch (e) {}

  /* What the connection can actually carry.

     This matters more than anything else in the file. An adaptive player
     with no starting estimate opens at whatever it guesses, and a guess
     that is too high is far worse than one that is too low: it fetches a
     rendition the link cannot sustain, stalls, and the visitor watches a
     spinner instead of a film. The browser has already measured the
     link, so use its number rather than a hopeful constant. */
  var NET = (function () {
    var c = {};
    try {
      c = navigator.connection || navigator.mozConnection ||
          navigator.webkitConnection || {};
    } catch (e) {}
    var eff = c.effectiveType || '';
    return {
      saveData: !!c.saveData,
      slow: /^(slow-)?2g$/.test(eff),   // nothing streams here
      modest: eff === '3g',             // streams, but not four at once
      /* 80% of the measured downlink, floored so a pessimistic reading
         cannot pin everything to the bottom rung for good. */
      estimate: c.downlink
        ? Math.max(700000, c.downlink * 1000000 * 0.8)
        : 2500000
    };
  })();

  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
    return n;
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* ------------------------------------------------------------------
     hls.js, fetched once and only when something actually needs it
     ------------------------------------------------------------------ */
  var hlsState = 0; // 0 untouched · 1 loading · 2 ready · 3 unavailable
  var hlsWaiting = [];

  function withHls(cb) {
    if (hlsState === 2) return cb(window.Hls);
    if (hlsState === 3) return cb(null);
    hlsWaiting.push(cb);
    if (hlsState === 1) return;
    hlsState = 1;
    var s = document.createElement('script');
    s.src = HLS_CDN;
    s.async = true;
    s.onload = function () {
      hlsState = (window.Hls && window.Hls.isSupported()) ? 2 : 3;
      flushHls();
    };
    s.onerror = function () { hlsState = 3; flushHls(); };
    document.head.appendChild(s);
  }
  function flushHls() {
    var q = hlsWaiting, i;
    hlsWaiting = [];
    for (i = 0; i < q.length; i++) q[i](hlsState === 2 ? window.Hls : null);
  }

  function nativeHls(video) {
    return !!video.canPlayType('application/vnd.apple.mpegurl');
  }

  /* Which rendition a tile should stream.

     Measured on the SHORT side, never on height. Half of this archive is
     shot 9:16, and a portrait ladder reports its levels as
     640/960/1280/1920 high — so a `height <= 540` test matches nothing
     at all and the tile quietly streams the 1080p master, which is the
     exact opposite of the point. The short side is 360 / 540 / 720 /
     1080 whichever way the frame is turned.

     The rule is round UP, not down: take the first rung that covers the
     card at its drawn size, so a 414px-tall card gets 540p rather than
     360p upscaled by a sixth. Rounding down saves a few hundred KB and
     costs the thing the page is for. The cap is the ceiling on that —
     720 normally, 540 on a modest link — and if nothing under the cap is
     big enough, the biggest thing under it wins.

     Returns -1 for "no cap": the player wants the whole ladder. */
  function pickLevel(levels, opts) {
    if (!opts.cap || !levels || !levels.length) return -1;

    var need = 0;
    if (opts.fit) {
      var r = opts.fit.getBoundingClientRect();
      var side = Math.min(r.width, r.height);
      if (side > 0) need = side * Math.min(window.devicePixelRatio || 1, 2);
    }

    var up = -1, upShort = 1e9;      // smallest rung that covers `need`
    var top = -1, topShort = -1;     // biggest rung under the cap
    var any = -1, anyShort = 1e9;    // smallest rung there is
    for (var i = 0; i < levels.length; i++) {
      var sh = Math.min(levels[i].width || 1e9, levels[i].height || 1e9);
      if (sh < anyShort) { anyShort = sh; any = i; }
      if (sh > opts.cap) continue;
      if (sh > topShort) { topShort = sh; top = i; }
      if (sh >= need && sh < upShort) { upShort = sh; up = i; }
    }
    if (up >= 0) return up;
    if (top >= 0) return top;
    return any;
  }

  /* ---- NO MACHINE-MADE CAPTIONS, ANYWHERE ----------------------------
     Gumlet auto-transcribes anything with speech and writes the result
     into the master playlist as

       #EXT-X-MEDIA:TYPE=SUBTITLES,...,DEFAULT=YES,AUTOSELECT=YES

     Three of the twenty-three carry one — HubSpot AI, Alistair Alvin
     and Lion's Mane, which are the three with people talking to camera.
     DEFAULT=YES is an instruction to switch it on, so hls.js did: rows
     of machine-guessed speech burned across the bottom of a SILENT
     b-roll tile, sitting on top of the title, and across the film in
     the player. Nobody asked for them and they are not part of the work.

     Turned off in three places, because each covers a path the others
     do not: the config stops hls.js parsing or rendering them at all,
     the explicit -1 covers a manifest already parsed before that lands,
     and the textTracks listener catches whatever the BROWSER adds by
     itself — which is the whole story on iOS, where playback is native
     and hls.js never runs. */
  function muteTextTracks(video) {
    var tt = video.textTracks;
    if (!tt) return;
    function off() {
      for (var i = 0; i < tt.length; i++) tt[i].mode = 'disabled';
    }
    off();
    if (tt.addEventListener) {
      tt.addEventListener('addtrack', function (e) {
        if (e && e.track) e.track.mode = 'disabled';
        off();
      });
    }
  }

  /* Puts `item` into `video` and hands back a teardown function.

     hls.js is tried first, even in the browsers that now claim to play
     HLS natively, for two reasons. Chrome answers "maybe" to
     canPlayType('application/vnd.apple.mpegurl') whether or not it can
     actually play one, so the native path is a guess; and native
     playback picks its own rendition, which means a silent hover preview
     would happily climb to 1080p. Driving the ladder ourselves is the
     whole reason a hover costs a few hundred KB instead of fifteen MB.

     iOS has no MSE, so Hls.isSupported() is false there and the native
     path is the right one — and it is genuinely native there.

     opts: { fit: <element whose drawn size sets the rendition, optional>,
             cap: <ceiling on the short side, 0 for the full ladder>,
             autoplay: bool, allowMp4: bool, onReady: fn, onError: fn } */
  function mount(video, item, opts) {
    opts = opts || {};
    var dead = false, inst = null, onErr = null;
    muteTextTracks(video);

    function play() {
      var p = video.play();
      if (p && p['catch']) p['catch'](function () {});
    }
    function ready() {
      if (opts.onReady) opts.onReady();
      if (opts.autoplay) play();
    }

    /* last resort: the progressive master. Only ever for the player,
       where the visitor has actually asked to watch something. */
    function useMp4() {
      if (dead) return;
      if (!opts.allowMp4) { if (opts.onError) opts.onError(); return; }
      video.src = MZ.mp4(item);
      video.addEventListener('loadedmetadata', ready, { once: true });
    }

    function useNative() {
      if (dead) return;
      if (!nativeHls(video)) { useMp4(); return; }
      onErr = function () {
        video.removeEventListener('error', onErr);
        onErr = null;
        useMp4();
      };
      video.addEventListener('error', onErr);
      video.src = MZ.hls(item);
      video.addEventListener('loadedmetadata', ready, { once: true });
    }

    withHls(function (Hls) {
      if (dead) return;
      if (!Hls) { useNative(); return; }

      inst = new Hls({
        capLevelToPlayerSize: false,
        /* Tiles buffer greedily and keep what they have played.

           These clips are 18 to 75 seconds and they loop. Holding one
           whole clip costs a couple of MB of memory and buys silence:
           the tile fetches once, then runs off the buffer for as long as
           the visitor leaves it on screen. A small rolling window would
           re-fetch the same forty seconds all afternoon, which is what a
           slow connection feels as stutter. */
        maxBufferLength: opts.cap ? 60 : 30,
        maxMaxBufferLength: opts.cap ? 90 : 60,
        backBufferLength: opts.cap ? 90 : 12,
        enableWorker: true,
        /* see muteTextTracks above — none of the auto-transcribed
           caption tracks in these masters is ever wanted */
        subtitleDisplay: false,
        renderTextTracksNatively: false,
        enableWebVTT: false,
        enableIMSC1: false,
        enableCEA708Captions: false,
        /* Without a seed hls.js opens at its floor and climbs, which on a
           twenty-second clip means the whole thing plays soft. Starting
           from a real-world estimate lets the first segment already be
           the right rendition; ABR corrects from there either way. */
        abrEwmaDefaultEstimate: opts.cap ? NET.estimate : NET.estimate * 1.5,
        startLevel: -1,
        startFragPrefetch: true
      });
      inst.on(Hls.Events.MANIFEST_PARSED, function () {
        try { inst.subtitleTrack = -1; } catch (e) {}
        muteTextTracks(video);
        var idx = pickLevel(inst.levels, opts);
        if (idx >= 0) {
          inst.autoLevelCapping = idx;
          inst.currentLevel = idx;
        }
        ready();
      });
      inst.on(Hls.Events.ERROR, function (_e, data) {
        if (!data || !data.fatal || dead) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) { inst.startLoad(); return; }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) { inst.recoverMediaError(); return; }
        try { inst.destroy(); } catch (e) {}
        inst = null;
        useNative();
      });
      inst.loadSource(MZ.hls(item));
      inst.attachMedia(video);
    });

    return function () {
      dead = true;
      if (onErr) { video.removeEventListener('error', onErr); onErr = null; }
      if (inst) { try { inst.destroy(); } catch (e) {} inst = null; }
      video.removeAttribute('src');
      try { video.load(); } catch (e) {}
    };
  }

  /* ------------------------------------------------------------------
     The card
     ------------------------------------------------------------------ */
  var POSTER_W = { reel: 620, medium: 1180, feature: 1760 };

  function buildCard(item, ordinal, extraClass) {
    var w = POSTER_W[item.shape] || 1180;
    var credit = MZ.credit(item);
    var label = 'Play ' + item.title + (credit ? ', ' + credit.toLowerCase() : '') +
                ', ' + MZ.time(item.dur);

    var card = el('button', 'wk-card wk-card--' + item.shape + (extraClass ? ' ' + extraClass : ''),
                  { type: 'button', 'aria-label': label });
    /* The frame is drawn at the master's own aspect. Nothing on this page
       is squeezed into a ratio it was not shot for. */
    card.style.setProperty('--wk-ar', MZ.ar(item));

    var frame = el('span', 'wk-frame');

    var img = el('img', 'wk-poster', {
      alt: '', loading: 'lazy', decoding: 'async',
      src: MZ.poster(item, w),
      srcset: MZ.poster(item, w) + ' 1x, ' + MZ.poster(item, Math.round(w * 1.7)) + ' 2x'
    });

    var vid = el('video', 'wk-prev', {
      muted: 'muted', loop: 'loop', playsinline: 'playsinline',
      preload: 'none', 'aria-hidden': 'true', tabindex: '-1'
    });
    vid.muted = true;          // the attribute alone is not enough in Safari
    vid.defaultMuted = true;
    vid.disablePictureInPicture = true;

    var rail = el('span', 'wk-rail');
    var num = el('span', 'wk-num'); num.textContent = pad2(ordinal);
    var run = el('span', 'wk-run'); run.textContent = MZ.time(item.dur);
    rail.appendChild(num); rail.appendChild(run);

    var play = el('span', 'wk-play');
    play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6L19 12z"/></svg>';

    /* The title block, printed on the frame. A reel gets the client
       only: at a third of the page's width the full line — category,
       note and client — wraps to three rows of mono over the footage,
       and the strand chips above already carry the category. */
    var meta = el('span', 'wk-meta');
    meta.appendChild(el('span', 'wk-rule'));
    var t = el('span', 'wk-title'); t.textContent = item.title;
    meta.appendChild(t);
    var c = el('span', 'wk-credit');
    c.textContent = item.shape === 'reel'
      ? (credit || MZ.cats(item))
      : MZ.cats(item) + (credit ? ' — ' + credit : '');
    meta.appendChild(c);

    frame.appendChild(img);
    frame.appendChild(vid);
    frame.appendChild(el('span', 'wk-scrim'));
    frame.appendChild(rail);
    frame.appendChild(play);
    frame.appendChild(meta);
    card.appendChild(frame);

    card._item = item;
    return card;
  }

  /* ------------------------------------------------------------------
     PLAYBACK — the grid plays itself

     Every card runs its clip, silently, as soon as it is on screen; it
     stops the moment it leaves. That is the whole behaviour, and the
     rest of this block exists to make it affordable.

     Twenty-three simultaneous decoders would melt a laptop and a data
     plan, so what actually runs is the handful nearest the middle of the
     viewport (PLAY_MAX). Cards are ranked by distance from the viewport
     centre on every scroll frame; the winners are mounted, the losers
     are stopped and, shortly after, torn down. A card that is stopped
     but still mounted restarts instantly, which is what makes scrolling
     back up feel immediate rather than staged.

     Quality is chosen from the size the card is actually drawn at, so a
     380px reel takes the 360p rendition and a full-bleed band takes 720p
     — sharp on screen, a fraction of the master either way.

     It backs all the way off where it should: reduced motion, Data
     Saver, and 2g/3g connections keep their posters and nothing loads.
     ------------------------------------------------------------------ */
  var pool = [];        // mounted, in play order
  var watched = [];     // every card currently in the grid
  var playIO = null;
  var syncQueued = false;

  /* Data Saver and 2g keep their posters; 3g still plays, just fewer at
     once and a rung lower. Refusing to play on 3g would switch the whole
     idea off for a large part of the world. */
  var AUTOPLAY = !REDUCED && !NET.saveData && !NET.slow;

  /* A phone is one card wide and metered more often than not; a 2K
     screen shows a whole band of three plus the edges of the next, and
     four was leaving the third reel of every run sitting on its poster
     while the visitor looked straight at it. */
  function playBudget() {
    if (NET.modest) return innerWidth <= 700 ? 1 : 2;
    if (innerWidth <= 700) return 2;
    if (innerWidth <= 1180) return 4;
    if (innerWidth <= 1700) return 5;
    return PLAY_MAX;
  }
  /* The cards just off the bottom of the screen. They are mounted and
     buffered but not played, which costs a fetch and no decoding, and
     buys the thing that was actually wrong: arriving at a card and
     finding it already running instead of finding a still and a wait. */
  function warmBudget() {
    if (NET.modest || NET.saveData) return 0;
    return innerWidth <= 700 ? 1 : WARM_MAX;
  }
  /* On a modest link a tile takes a rung below what its size deserves —
     it is 380px of silent b-roll, not the film. */
  function tileCap() { return NET.modest ? 540 : PREVIEW_CAP; }

  function release(rec) {
    if (!rec) return;
    clearTimeout(rec.reap);
    /* the class goes first: a video whose src has just been pulled
       paints nothing, so dropping is-live in the same breath lets the
       poster come back through the fade instead of after it */
    rec.card.classList.remove('is-live');
    try { rec.video.pause(); } catch (e) {}
    if (rec.kill) rec.kill();
    rec.card._pv = null;
    var i = pool.indexOf(rec);
    if (i >= 0) pool.splice(i, 1);
  }
  /* Stops and tears down every mounted clip. The watch list is left
     alone: these cards are still on the page and still want to play the
     next time sync() runs. */
  function releaseAll() {
    while (pool.length) release(pool[0]);
  }

  function playRec(rec) {
    var p = rec.video.play();
    if (p && p['catch']) p['catch'](function () {});
  }

  /* Gives a card a player without starting it. Warming and playing are
     the same act up to this point, which is the whole reason promoting a
     warm card is instant: the manifest is parsed, the rendition is
     chosen and the first segments are in the buffer already. */
  function attach(card) {
    var rec = card._pv;
    if (rec) { clearTimeout(rec.reap); return rec; }
    var video = card.querySelector('.wk-prev');
    if (!video) return null;

    rec = { card: card, video: video, kill: null, reap: 0, want: false };
    card._pv = rec;
    pool.push(rec);

    /* Only reveal the moving frame once there is one; until then the
       poster stays, so a card never flashes black while it loads. */
    video.addEventListener('playing', function () {
      if (card._pv === rec) card.classList.add('is-live');
    });

    rec.kill = mount(video, card._item, {
      fit: video,          // pick the rendition from the drawn size
      cap: tileCap(),
      autoplay: false,     // start() decides, and it may decide later
      allowMp4: false,
      /* the one moment a play() is certain to be legal: the source is
         attached and the ladder is chosen. A card promoted from warm to
         playing before this fires gets its play here instead. */
      onReady: function () { if (card._pv === rec && rec.want) playRec(rec); }
    });
    return rec;
  }

  function start(card) {
    var rec = attach(card);
    if (!rec) return;
    rec.want = true;
    if (rec.video.readyState >= 2) card.classList.add('is-live');
    playRec(rec);
  }

  /* Paused, but everything it had is kept: the element, the buffer, the
     decoded frame on screen. Scrolling back onto it is a play() and
     nothing else. */
  function idle(rec) {
    if (!rec || !rec.want) return;
    rec.want = false;
    try { rec.video.pause(); } catch (e) {}
  }
  function reap(rec, teardown) {
    if (!rec || rec.reap) return;
    rec.reap = setTimeout(function () { release(rec); }, teardown || KEEP_ALIVE);
  }

  /* Rank what is near the viewport and spend two budgets on it: the
     play budget on the middle of the screen, the warm budget on what is
     coming next.

     This measures the cards itself rather than trusting a list the
     observer has been maintaining. One layout read for twenty-three
     rects, once per animation frame at most, is cheap — and it means the
     grid still plays if an observer callback is late, coalesced or never
     delivered, which is the difference between a wall of posters and a
     wall of film. The observer's only job is to say "something moved". */
  function sync() {
    syncQueued = false;
    if (!AUTOPLAY || document.hidden || LB.isOpen()) return;

    var mid = innerHeight / 2;
    var near = innerHeight * 0.2;    // "on screen", give or take
    var reach = innerHeight * 1.4;   // "coming up", worth buffering
    var ranked = [];

    for (var i = 0; i < watched.length; i++) {
      var card = watched[i];
      if (!card.isConnected) continue;
      var r = card.getBoundingClientRect();
      if (!r.height) continue;
      if (r.bottom < -reach || r.top > innerHeight + reach) continue;
      /* A reel shelf on a phone scrolls sideways, so a card can be in
         the viewport vertically and still be nowhere near it. */
      if (r.right < -40 || r.left > innerWidth + 40) continue;
      ranked.push({
        card: card,
        d: Math.abs(r.top + r.height / 2 - mid),
        vis: r.bottom > -near && r.top < innerHeight + near
      });
    }
    ranked.sort(function (a, b) { return a.d - b.d; });

    var plays = [], warms = [];
    var pb = playBudget(), wb = warmBudget();
    for (var k = 0; k < ranked.length; k++) {
      if (ranked[k].vis && plays.length < pb) plays.push(ranked[k].card);
      else if (warms.length < wb) warms.push(ranked[k].card);
    }

    pool.slice().forEach(function (rec) {
      var wantsPlay = plays.indexOf(rec.card) >= 0;
      var wantsWarm = !wantsPlay && warms.indexOf(rec.card) >= 0;
      if (!wantsPlay) idle(rec);
      if (wantsPlay || wantsWarm) { clearTimeout(rec.reap); rec.reap = 0; }
      else reap(rec);
    });
    warms.forEach(attach);
    plays.forEach(start);
  }

  function queueSync() {
    if (syncQueued) return;
    syncQueued = true;
    /* rAF for the scroll case, where measuring on the frame is the point;
       a timer behind it because rAF does not run in a background tab and
       a grid built in one would otherwise sit on its posters for ever.
       sync() clears the flag, so only the first of the two does work. */
    requestAnimationFrame(sync);
    setTimeout(function () { if (syncQueued) sync(); }, 300);
  }

  var wired = false;
  function watch(card) {
    if (!AUTOPLAY) return;
    watched.push(card);
    if (!wired) {
      wired = true;
      addEventListener('scroll', queueSync, { passive: true });
      addEventListener('resize', queueSync, { passive: true });
      /* A second nudge, for the movements a scroll listener never sees:
         a theme flip resizing a section above, a font landing, an image
         finishing and pushing everything down. */
      if ('IntersectionObserver' in window) {
        playIO = new IntersectionObserver(queueSync,
          { rootMargin: '20% 0px 20% 0px', threshold: [0, 0.25, 0.75] });
      }
    }
    if (playIO) playIO.observe(card);
    queueSync();
  }
  function unwatchAll() {
    if (playIO) playIO.disconnect();
    watched.length = 0;
  }

  /* The player script is 100-odd KB gzipped and every card needs it, so
     it is fetched as soon as the grid is anywhere near — not at the
     moment the first card needs to draw, which is a frame too late. */
  function warm() {
    if (!AUTOPLAY) return;
    withHls(function () {});
  }

  function wireCard(card, listGetter) {
    watch(card);
    card.addEventListener('click', function () {
      var list = listGetter();
      LB.open(list, list.indexOf(card._item), card);
    });
  }

  /* ------------------------------------------------------------------
     Reveal on scroll — the same "rise into place" the rest of the page
     uses, done with an observer so /work.html needs no GSAP.
     ------------------------------------------------------------------ */
  var revealIO = null;
  if (!REDUCED && 'IntersectionObserver' in window) {
    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        revealIO.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  }
  function reveal(node, i) {
    if (!revealIO) { node.classList.add('is-in'); return; }
    node.style.setProperty('--wk-d', (Math.min(i, 5) * 70) + 'ms');
    revealIO.observe(node);
  }
  /* Anything already on screen when the grid is built is shown at once
     rather than waiting on an observer callback — on the archive page the
     first two rows are above the fold, and a page that opens blank while
     it waits for a frame is worse than no animation at all. */
  function revealVisible(nodes) {
    function run() {
      nodes.forEach(function (n) {
        if (n.getBoundingClientRect().top < innerHeight * 1.05) n.classList.add('is-in');
      });
    }
    /* rAF for a measurement taken after layout; the timer because rAF
       does not run in a background tab, and a grid built in one must not
       be sitting at opacity 0 when the visitor finally looks at it. */
    requestAnimationFrame(run);
    setTimeout(run, 400);
  }

  /* ══════════════════════════════════════════════════════════════════
     THE PLAYER
     ══════════════════════════════════════════════════════════════════ */
  /* every card currently in the DOM, so the player can hand the visitor
     back to whichever piece they stopped on */
  function cardFor(item) {
    if (!item) return null;
    var all = document.querySelectorAll('.wk-card'), i;
    for (i = 0; i < all.length; i++) if (all[i]._item === item) return all[i];
    return null;
  }

  var LB = (function () {
    var root = null, video = null, box = null, spin = null;
    var elTitle, elCredit, elCount, elCur, elDur, fill, buf, knob, scrub;
    var btnPlay, btnMute, btnFull, btnPrev, btnNext, btnClose;
    var list = [], idx = -1, opener = null, kill = null, open = false;
    var amb = null, ambWasOn = false, ambGuard = null, dragging = false;

    function icon(paths) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true">' + paths + '</svg>';
    }
    var I_PLAY  = icon('<path d="M8 5.2v13.6L19 12z"/>');
    var I_PAUSE = icon('<path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/>');
    var I_VOL   = icon('<path d="M4 9.5h3.6L12 5.4v13.2L7.6 14.5H4zM15.4 8.6a4.8 4.8 0 0 1 0 6.8l1.3 1.3a6.6 6.6 0 0 0 0-9.4z"/>');
    var I_MUTE  = icon('<path d="M4 9.5h3.6L12 5.4v13.2L7.6 14.5H4zM15 9.4l1.3-1.3 2 2 2-2 1.3 1.3-2 2 2 2-1.3 1.3-2-2-2 2L15 15.4l2-2z"/>');
    var I_FULL  = icon('<path d="M4 9V4h5v2H6v3zm11-5h5v5h-2V6h-3zM6 15v3h3v2H4v-5zm12 0h2v5h-5v-2h3z"/>');
    var I_EXIT  = icon('<path d="M9 4v5H4V7h3V4zm6 0h2v3h3v2h-5zM4 15h5v5H7v-3H4zm13 2v3h-2v-5h5v2z"/>');

    function build() {
      root = el('div', 'wk-lb', { 'aria-hidden': 'true', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Work player' });
      root.appendChild(el('div', 'wk-lb-veil'));

      var shell = el('div', 'wk-lb-shell');

      var head = el('div', 'wk-lb-head');
      elCount = el('p', 'wk-lb-eb');
      btnClose = el('button', 'wk-lb-close', { type: 'button', 'aria-label': 'Close player' });
      btnClose.innerHTML = 'Close<span><svg viewBox="0 0 24 24" aria-hidden="true">' +
                           '<path d="M6 6 18 18M18 6 6 18"/></svg></span>';
      head.appendChild(elCount);
      head.appendChild(btnClose);

      var stage = el('div', 'wk-lb-stage');
      box = el('div', 'wk-lb-box');
      video = el('video', 'wk-lb-video', { playsinline: 'playsinline', preload: 'metadata' });
      video.setAttribute('webkit-playsinline', 'true');
      box.appendChild(video);
      spin = el('div', 'wk-lb-spin');
      stage.appendChild(box);
      stage.appendChild(spin);

      var foot = el('div', 'wk-lb-foot');

      scrub = el('div', 'wk-scrub', { role: 'slider', tabindex: '0',
        'aria-label': 'Seek', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' });
      var track = el('div', 'wk-scrub-track');
      buf = el('i', 'wk-scrub-buf'); fill = el('i', 'wk-scrub-fill');
      track.appendChild(buf); track.appendChild(fill);
      knob = el('i', 'wk-scrub-knob');
      scrub.appendChild(track); scrub.appendChild(knob);

      var bar = el('div', 'wk-lb-bar');
      var ctrl = el('div', 'wk-lb-ctrl');
      btnPlay = el('button', 'wk-btn wk-btn--play', { type: 'button', 'aria-label': 'Pause' });
      btnPlay.innerHTML = I_PAUSE;
      btnMute = el('button', 'wk-btn', { type: 'button', 'aria-label': 'Mute' });
      btnMute.innerHTML = I_VOL;
      btnFull = el('button', 'wk-btn', { type: 'button', 'aria-label': 'Fullscreen' });
      btnFull.innerHTML = I_FULL;
      var time = el('p', 'wk-time');
      elCur = el('b'); elCur.textContent = '0:00';
      elDur = document.createTextNode(' / 0:00');
      time.appendChild(elCur); time.appendChild(elDur);
      ctrl.appendChild(btnPlay); ctrl.appendChild(btnMute); ctrl.appendChild(btnFull); ctrl.appendChild(time);

      var id = el('div', 'wk-lb-id');
      elTitle = el('p', 'wk-lb-title');
      elCredit = el('p', 'wk-lb-credit');
      id.appendChild(elTitle); id.appendChild(elCredit);

      var nav = el('div', 'wk-lb-nav');
      btnPrev = el('button', 'wk-nav-btn', { type: 'button', 'aria-label': 'Previous piece' });
      btnPrev.innerHTML = '←<span>Prev</span>';
      btnNext = el('button', 'wk-nav-btn', { type: 'button', 'aria-label': 'Next piece' });
      btnNext.innerHTML = '<span>Next</span>→';
      nav.appendChild(btnPrev); nav.appendChild(btnNext);

      bar.appendChild(ctrl); bar.appendChild(id); bar.appendChild(nav);

      var hint = el('p', 'wk-hint');
      hint.innerHTML = '<kbd>Space</kbd> play &nbsp;<kbd>←</kbd><kbd>→</kbd> move &nbsp;' +
                       '<kbd>M</kbd> mute &nbsp;<kbd>F</kbd> full &nbsp;<kbd>Esc</kbd> close';

      foot.appendChild(scrub); foot.appendChild(bar); foot.appendChild(hint);

      shell.appendChild(head); shell.appendChild(stage); shell.appendChild(foot);
      root.appendChild(shell);
      document.body.appendChild(root);

      wire();
    }

    function wire() {
      btnClose.addEventListener('click', close);
      root.querySelector('.wk-lb-veil').addEventListener('click', close);
      btnPrev.addEventListener('click', function () { go(-1); });
      btnNext.addEventListener('click', function () { go(1); });
      btnPlay.addEventListener('click', toggle);
      btnMute.addEventListener('click', function () { setMuted(!video.muted); });
      btnFull.addEventListener('click', full);

      video.addEventListener('timeupdate', paint);
      video.addEventListener('progress', paintBuf);
      video.addEventListener('durationchange', paint);
      video.addEventListener('play', paintPlay);
      video.addEventListener('pause', paintPlay);
      video.addEventListener('waiting', function () { root.classList.add('is-buffering'); });
      video.addEventListener('playing', function () { root.classList.remove('is-buffering'); });
      video.addEventListener('canplay', function () { root.classList.remove('is-buffering'); });
      video.addEventListener('ended', function () { go(1); });
      video.addEventListener('click', toggle);

      scrub.addEventListener('pointerdown', function (e) {
        dragging = true;
        scrub.classList.add('is-drag');
        scrub.setPointerCapture(e.pointerId);
        seekTo(e);
      });
      scrub.addEventListener('pointermove', function (e) { if (dragging) seekTo(e); });
      scrub.addEventListener('pointerup', function (e) {
        dragging = false;
        scrub.classList.remove('is-drag');
        try { scrub.releasePointerCapture(e.pointerId); } catch (err) {}
      });
      scrub.addEventListener('keydown', function (e) {
        if (!video.duration) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault(); e.stopPropagation();
          video.currentTime = Math.max(0, Math.min(video.duration,
            video.currentTime + (e.key === 'ArrowRight' ? 5 : -5)));
        }
      });

      document.addEventListener('fullscreenchange', function () {
        btnFull.innerHTML = document.fullscreenElement ? I_EXIT : I_FULL;
        btnFull.setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen');
      });

      window.addEventListener('keydown', onKey, true);
    }

    function seekTo(e) {
      if (!video.duration) return;
      var r = scrub.getBoundingClientRect();
      var k = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      video.currentTime = k * video.duration;
      paint();
    }

    function paint() {
      var d = video.duration || list[idx] && list[idx].dur || 0;
      var t = video.currentTime || 0;
      var k = d ? Math.max(0, Math.min(1, t / d)) : 0;
      fill.style.width = (k * 100) + '%';
      knob.style.left = (k * 100) + '%';
      elCur.textContent = MZ.time(t);
      elDur.nodeValue = ' / ' + MZ.time(d);
      scrub.setAttribute('aria-valuenow', Math.round(k * 100));
      scrub.setAttribute('aria-valuetext', MZ.time(t) + ' of ' + MZ.time(d));
    }
    function paintBuf() {
      if (!video.duration || !video.buffered.length) return;
      buf.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration * 100) + '%';
    }
    function paintPlay() {
      var p = video.paused;
      btnPlay.innerHTML = p ? I_PLAY : I_PAUSE;
      btnPlay.setAttribute('aria-label', p ? 'Play' : 'Pause');
    }
    function setMuted(m) {
      video.muted = m;
      btnMute.innerHTML = m ? I_MUTE : I_VOL;
      btnMute.setAttribute('aria-label', m ? 'Unmute' : 'Mute');
    }
    function toggle() {
      if (video.paused) { var p = video.play(); if (p && p['catch']) p['catch'](function () {}); }
      else video.pause();
    }
    function full() {
      if (document.fullscreenElement) { document.exitFullscreen(); return; }
      var target = box.requestFullscreen ? box : video;
      if (target.requestFullscreen) target.requestFullscreen()['catch'](function () {});
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    }

    function onKey(e) {
      if (!open) return;
      var k = e.key, done = true;
      if (k === 'Escape') close();
      else if (k === 'ArrowRight') go(1);
      else if (k === 'ArrowLeft') go(-1);
      else if (k === ' ' || k === 'Spacebar' || k === 'k' || k === 'K') toggle();
      else if (k === 'm' || k === 'M') setMuted(!video.muted);
      else if (k === 'f' || k === 'F') full();
      else if (k === 'Tab') { trap(e); done = false; }
      else if (/^[0-9]$/.test(k)) { /* swallowed: the ambience player owns these */ }
      else done = false;
      if (done) { e.preventDefault(); e.stopPropagation(); }
      else if (/^[0-9]$/.test(k)) e.stopPropagation();
    }

    function trap(e) {
      var f = root.querySelectorAll('button, [tabindex="0"]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    /* The studio's ambience and a film's own sound must never be audible
       together.

       Pausing it once on open is not enough, and the reason is a race
       worth writing down: mz-sound.js starts the ambience from a
       capture-phase `pointerdown` on window, because browsers block
       audio until the first gesture. If the visitor's first gesture on
       the page is clicking a card, that pointerdown starts the ambience
       and the click that opens the player runs before `play()` has
       resolved — so `amb.paused` is still true, we conclude there was
       nothing to pause, and the music arrives a moment later over the
       top of the film. Hence the guard: while the player is open, any
       attempt to start the ambience is undone immediately. */
    function hushAmbience() {
      amb = document.querySelector('audio[data-mz-ambience]');
      if (!amb) return;
      ambWasOn = !amb.paused;
      amb.pause();
      ambGuard = function () {
        if (!open) return;
        ambWasOn = true;
        amb.pause();
      };
      amb.addEventListener('play', ambGuard);
    }
    function restoreAmbience() {
      if (!amb) return;
      if (ambGuard) { amb.removeEventListener('play', ambGuard); ambGuard = null; }
      if (ambWasOn) {
        var p = amb.play();
        if (p && p['catch']) p['catch'](function () {});
      }
      ambWasOn = false;
    }

    function load(i) {
      if (kill) { kill(); kill = null; }
      idx = i;
      var item = list[idx];
      if (!item) return;

      video.poster = MZ.poster(item, 1600);
      video.currentTime = 0;
      root.classList.add('is-buffering');
      elTitle.textContent = item.title;
      elCredit.textContent = MZ.cats(item) + (MZ.credit(item) ? ' — ' + MZ.credit(item) : '');
      elCount.innerHTML = '<b>' + pad2(idx + 1) + '</b> / ' + pad2(list.length);
      root.setAttribute('aria-label', 'Playing ' + item.title);
      elDur.nodeValue = ' / ' + MZ.time(item.dur);
      elCur.textContent = '0:00';
      fill.style.width = '0%'; buf.style.width = '0%'; knob.style.left = '0%';

      var only = list.length < 2;
      btnPrev.disabled = only; btnNext.disabled = only;
      btnPrev.style.display = btnNext.style.display = only ? 'none' : '';

      kill = mount(video, item, { cap: 0, autoplay: true, allowMp4: true });
      setMuted(false);
      paintPlay();
    }

    function go(d) {
      if (list.length < 2) return;
      load((idx + d + list.length) % list.length);
    }

    function open_(items, i, from) {
      if (!root) build();
      list = items.slice();
      opener = from || null;
      open = true;

      hushAmbience();
      releaseAll();

      document.documentElement.classList.add('wk-locked');
      if (window.lenisInstance && window.lenisInstance.stop) window.lenisInstance.stop();

      root.classList.add('is-open');
      root.setAttribute('aria-hidden', 'false');
      /* One frame, so the veil and shell have something to transition
         from. The timer is not a duplicate: rAF does not run in a
         background tab, and a player that opened invisible because the
         page was hidden when it was asked to open would stay that way. */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { root.classList.add('is-in'); });
      });
      setTimeout(function () { if (open) root.classList.add('is-in'); }, 80);
      load(i < 0 ? 0 : i);
      setTimeout(function () { btnClose.focus(); }, 60);
    }

    function close() {
      if (!open) return;
      open = false;
      if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) {} }
      try { video.pause(); } catch (e) {}
      if (kill) { kill(); kill = null; }
      root.classList.remove('is-in', 'is-buffering');
      root.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('wk-locked');
      if (window.lenisInstance && window.lenisInstance.start) window.lenisInstance.start();
      restoreAmbience();
      if (window.MZ_WORK_UI) window.MZ_WORK_UI.sync();
      setTimeout(function () { if (!open) root.classList.remove('is-open'); }, 460);

      /* Where the visitor lands. focus() scrolls by default, which threw
         the page somewhere unrelated on close; so focus is moved without
         it, and then the grid is only moved if the piece they ended on
         is not already on screen — browse from 04 to 15 inside the
         player, close, and the grid is sitting on 15. */
      var land = cardFor(list[idx]) || opener;
      if (land && land.focus) land.focus({ preventScroll: true });
      if (land) {
        var r = land.getBoundingClientRect();
        if (r.bottom < 80 || r.top > innerHeight - 80) {
          land.scrollIntoView({ block: 'center', behavior: 'auto' });
        }
      }
      opener = null;
    }

    return { open: open_, close: close, isOpen: function () { return open; } };
  })();

  /* ══════════════════════════════════════════════════════════════════
     THE HOMEPAGE SECTION
     ══════════════════════════════════════════════════════════════════ */
  var FEAT_SLOTS = 6;   // the mosaic in work.css is cut for six

  function mountFeatured() {
    var host = document.getElementById('wkFeat');
    if (!host) return;
    var items = MZ.featured().slice(0, FEAT_SLOTS);
    var getList = function () { return items; };
    host.innerHTML = '';
    var built = [], n = 0;

    function card(item, i) {
      var c = buildCard(item, i + 1);
      wireCard(c, getList);
      reveal(c, n++);
      built.push(c);
      return c;
    }
    function band(kind) {
      var b = el('div', 'wk-band wk-band--' + kind);
      host.appendChild(b);
      return b;
    }

    /* Band A - two stacked landscape pieces and the vertical one beside
       them. The column split that makes those two columns end on the
       same line is arithmetic, and it lives in work.css; nothing here
       stretches or crops anything to fake it. */
    var a = band('a');
    var stack = el('div', 'wk-stack');
    a.appendChild(stack);
    if (items[0]) stack.appendChild(card(items[0], 0));
    if (items[1]) stack.appendChild(card(items[1], 1));
    if (items[2]) a.appendChild(card(items[2], 2));

    /* Band B - two landscape pieces, equal halves, equal heights. */
    var b = band('b');
    if (items[3]) b.appendChild(card(items[3], 3));
    if (items[4]) b.appendChild(card(items[4], 4));

    /* Band C - the closing statement, or the frame held for it. */
    var c = band('c');
    if (items[5]) {
      c.appendChild(card(items[5], 5));
    } else {
      /* Flag a sixth entry in work-data.js with `feature: 6` and this
         fills by itself; until then it says so rather than leaving a
         hole in the mosaic. */
      var slot = el('div', 'wk-card');
      var box = el('div', 'wk-slot');
      var eb = el('span', 'wk-slot-eb');
      eb.textContent = 'W/' + pad2(FEAT_SLOTS) + ' \u00b7 In post';
      var t = el('p', 'wk-slot-t');
      t.appendChild(document.createTextNode('The next film lands here'));
      t.appendChild(el('i', 'wk-slot-caret'));
      var sub = el('p', 'wk-slot-s');
      sub.textContent = 'A wide cut is in the grade. It takes this frame the day it is delivered.';
      box.appendChild(eb); box.appendChild(t); box.appendChild(sub);
      slot.appendChild(box);
      c.appendChild(slot);
      reveal(slot, n++);
      built.push(slot);
    }

    revealVisible(built);
    warm();

    var count = document.getElementById('wkCount');
    if (count) count.textContent = pad2(items.length) + ' / ' + pad2(MZ.items.length);
  }

  /* ══════════════════════════════════════════════════════════════════
     THE ARCHIVE PAGE
     ══════════════════════════════════════════════════════════════════ */
  function mountArchive() {
    var host = document.getElementById('wkRows');
    if (!host) return;
    var bar = document.getElementById('wkFilters');
    var all = MZ.items;

    var current = 'all';
    var shown = all;

    function countFor(key) {
      return key === 'all' ? all.length
        : all.filter(function (p) { return p.cats.indexOf(key) >= 0; }).length;
    }

    /* Compose the filtered list into bands — the same vocabulary the
       featured mosaic uses upstairs.

         a  a vertical piece beside two stacked landscapes
         b  two landscapes, equal halves
         c  one wide piece, edge to edge
         r  three verticals across

       Taking the pieces strictly in order gave rows of one shape after
       another — three reels, two landscapes, a wide one, again and
       again — which is a grid however the gutters are tuned, because
       every row looks like the row above it. So the shapes are counted
       first and the bands dealt out instead: at each step the type with
       the most bands still owing that is NOT the type just placed. That
       spreads them as evenly as the counts allow, and for this archive
       it means no two neighbouring bands are ever alike.

       Each shape keeps its own internal order, and the ordinals are
       assigned along the composed order (see render), so the index
       still counts 01, 02, 03 straight down the page. */
    function compose(items) {
      var R = [], M = [], F = [], i, k;
      for (i = 0; i < items.length; i++) {
        var sh = items[i].shape;
        (sh === 'reel' ? R : sh === 'feature' ? F : M).push(items[i]);
      }

      /* Whatever a shape leaves over closes out in a short band rather
         than being dropped, so a strand filter never loses a piece. */
      var owed = {
        r: Math.ceil(R.length / 3),
        b: Math.ceil(M.length / 2),
        c: F.length
      };

      /* Roughly what each band costs in height, as a share of the page's
         width: a pair is 0.28, a wide piece 0.50, three reels 0.59, a
         reel beside a stack 0.69. Dealing purely by what is owed put
         both of the short bands in the back half and opened the page
         with five tall ones in a row; dealing purely by contrast
         clustered them at the front instead. Ten points a band still
         owing plus one per step of height difference balances the two:
         the types come out evenly consumed AND the page gets its relief
         at even intervals. */
      var HEIGHT = { b: 1, c: 2, r: 3 };
      var bands = [], last = '';
      for (;;) {
        var pick = '', best = -1;
        for (k in owed) {
          if (owed[k] <= 0 || k === last) continue;
          var score = owed[k] * 10 +
                      (last ? Math.abs(HEIGHT[k] - HEIGHT[last]) : 0);
          if (score > best) { best = score; pick = k; }
        }
        /* only the type just placed is left — take it rather than stop */
        if (!pick) for (k in owed) if (owed[k] > 0) { pick = k; break; }
        if (!pick) break;
        owed[pick]--;
        last = pick;

        if (pick === 'c') bands.push({ kind: 'c', items: [F.shift()] });
        else if (pick === 'b') bands.push({ kind: 'b', items: M.splice(0, 2) });
        else bands.push({ kind: 'r', items: R.splice(0, 3) });
      }
      return bands;
    }

    function render(key) {
      releaseAll();
      unwatchAll();
      current = key;
      shown = key === 'all' ? all
        : all.filter(function (p) { return p.cats.indexOf(key) >= 0; });

      host.innerHTML = '';
      if (!shown.length) {
        var none = el('p', 'wk-empty');
        none.textContent = 'Nothing filed under that yet.';
        host.appendChild(none);
        return;
      }

      /* The composed order is the page's order: the ordinals count down
         it, and the player's next/previous walks it, so what the index
         says and what the arrow keys do agree with what you can see. */
      var bands = compose(shown), n = 0, built = [], ordered = [];
      bands.forEach(function (b) { ordered = ordered.concat(b.items); });
      var ordinal = {};
      ordered.forEach(function (it, i) { ordinal[it.id] = i + 1; });
      var getList = function () { return ordered; };

      function card(item) {
        var c = buildCard(item, ordinal[item.id]);
        wireCard(c, getList);
        reveal(c, n++);
        built.push(c);
        return c;
      }

      bands.forEach(function (b) {
        var band = el('div', 'wk-band wk-band--' + b.kind);
        band.setAttribute('data-n', b.items.length);
        b.items.forEach(function (it) { band.appendChild(card(it)); });
        host.appendChild(band);
      });
      revealVisible(built);
      warm();

      if (bar) {
        Array.prototype.forEach.call(bar.children, function (b) {
          b.classList.toggle('is-on', b.getAttribute('data-k') === key);
          b.setAttribute('aria-pressed', b.getAttribute('data-k') === key ? 'true' : 'false');
        });
      }
      var live = document.getElementById('wkShown');
      if (live) {
        live.textContent = shown.length === all.length
          ? all.length + ' projects'
          : shown.length + ' of ' + all.length + ' projects';
      }
    }

    if (bar) {
      bar.innerHTML = '';
      MZ.strands.forEach(function (s) {
        var b = el('button', 'wk-filter', { type: 'button', 'data-k': s.key, 'aria-pressed': 'false' });
        b.appendChild(document.createTextNode(s.label));
        var c = el('em'); c.textContent = pad2(countFor(s.key));
        b.appendChild(c);
        b.addEventListener('click', function () {
          if (current === s.key) return;
          render(s.key);
          try {
            var q = s.key === 'all' ? location.pathname : location.pathname + '?c=' + s.key;
            history.replaceState(null, '', q);
          } catch (e) {}
        });
        bar.appendChild(b);
      });
    }

    var start = 'all';
    try {
      var m = /[?&]c=([a-z]+)/.exec(location.search);
      if (m && MZ.strands.some(function (s) { return s.key === m[1]; })) start = m[1];
    } catch (e) {}
    render(start);
  }

  /* ------------------------------------------------------------------ */
  function boot() {
    mountFeatured();
    mountArchive();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* Nothing keeps decoding while the tab is in the background; coming
     back re-reads the viewport rather than resuming whatever was
     playing when the visitor left. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      /* Pause, do not demolish. Tearing the whole grid down on every
         tab switch meant coming back to twenty-three posters and a
         second of nothing while they all remounted. The decoders stop
         either way; the buffers are worth keeping. */
      pool.slice().forEach(idle);
    } else queueSync();
  });

  window.MZ_WORK_UI = { lightbox: LB, releasePreviews: releaseAll, sync: queueSync };
})();
