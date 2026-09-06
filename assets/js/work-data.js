/* ══════════════════════════════════════════════════════════════════════
   MANZAR STUDIO — the production archive
   ══════════════════════════════════════════════════════════════════════
   One list, two consumers: the "Selected work" section on the homepage
   (which takes the five entries flagged `feature`) and /work.html (which
   takes all of them, in this order).

   Every asset lives on Gumlet, the same library the Manzar Productions
   site has always used, so nothing here is a re-upload or a re-encode —
   these are the original masters. Each entry carries only the asset id
   and the poster's cache token; the URLs are derived in work.js so a
   thumbnail can be asked for at the exact width a card needs, in webp,
   instead of the 1.1 MB PNG the CDN hands out by default.

   `shape` is how the piece was shot, not how it is displayed:
     reel       9:16, vertical
     medium     16:9
     cinematic  wide — gets a full-bleed row of its own

   `client` may be null. Two pieces here were not made for a client (a
   self-initiated documentary shoot, and a showreel cut from music
   videos); rather than invent an attribution, those carry a `note`.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var LIB = 'https://video.gumlet.io/698a1c64aec3d4e420bb9921/';

  /* id · poster cache token · shape · categories · title · client */
  var WORK = [
    { id: '69c60e23e018a8d703792291', v: '1774587495291', bg: '#316D2C', dur: 18, shape: 'reel',
      title: 'Language Shift', client: 'Burju', cats: ['creative'] },

    { id: '69c60edb123b739cbbe6078a', v: '1774587707243', bg: '#4E4C4B', dur: 33, shape: 'reel',
      title: 'Shilajit Podcast', client: 'Vitalis Living', cats: ['creative'] },

    { id: '69c60e23e018a8d7037922a5', v: '1774587605084', bg: '#4D4C4C', dur: 38, shape: 'reel',
      title: 'Pure Shilajit', client: 'Vitalis Living', cats: ['creative'],
      feature: 3 },

    { id: '698a2424aec3d4e420bc726f', v: '1770661287446', bg: '#574D42', dur: 24, shape: 'medium',
      title: 'Memento Mori', client: 'OGC', cats: ['music', 'film'] },

    { id: '698a2424873071aec5c3ad69', v: '1770693130544', bg: '#514F48', dur: 34, shape: 'medium',
      title: 'F**k You', client: 'OGC', cats: ['music', 'film'] },

    { id: '698a6768fc23d3d76fa95072', v: '1770678429380', bg: '#5B503E', dur: 59, shape: 'feature', ar: '2 / 1',
      title: 'Lahore', client: null, note: 'Self-initiated documentary',
      cats: ['film'] },

    { id: '69c601d0e018a8d703783026', v: '1774584816976', bg: '#48514E', dur: 29, shape: 'reel',
      title: 'Hamayoun Angar, live', client: 'DJMian', cats: ['creative'] },

    { id: '69c60e23e018a8d7037922ac', v: '1774587538591', bg: '#6A562F', dur: 18, shape: 'reel',
      title: 'Fashion Reel', client: 'Nikon Pakistan', cats: ['creative'] },

    { id: '69c60e23b365493ac08b0d68', v: '1774587665475', bg: '#504C49', dur: 20, shape: 'reel',
      title: 'Broker vs Leader', client: 'Revel Realty', cats: ['creative'] },

    { id: '698a2e34873071aec5c4c794', v: '1770692995312', bg: '#545445', dur: 53, shape: 'medium',
      title: 'KPEC Master Plan', client: 'NESPAK · Government of Pakistan',
      cats: ['commercial'], feature: 2 },

    { id: '698a2efefc23d3d76fa35334', v: '1770666226707', bg: '#514C48', dur: 39, shape: 'medium',
      title: 'HubSpot AI', client: 'Zed Digital', cats: ['commercial', 'creative'],
      feature: 1 },

    { id: '698a2fb7fc23d3d76fa368c5', v: '1770693294392', bg: '#4F4F4A', dur: 44, shape: 'feature',
      title: 'Music Video Showreel', client: null, note: 'Selected cuts',
      cats: ['music', 'film'] },

    { id: '698a31feaec3d4e420bdf6c2', v: '1770664682549', bg: '#503465', dur: 37, shape: 'medium',
      title: 'The Power of Focus', client: 'David Chen',
      cats: ['commercial', 'creative'], feature: 4 },

    { id: '698a7237fc23d3d76faa62f1', v: '1770682619789', bg: '#333B3B', dur: 62, shape: 'medium',
      title: 'Light & Sound Expo', client: 'IPS', cats: ['commercial'] },

    { id: '698a3318aec3d4e420be13f8', v: '1770664940575', bg: '#3F5A54', dur: 41, shape: 'reel',
      title: 'Alistair Alvin, live', client: 'Goonj 2.0, Lahore',
      cats: ['music', 'film'] },

    { id: '698a3660873071aec5c5a174', v: '1770693407996', bg: '#4B4E4B', dur: 36, shape: 'reel',
      title: 'Shilaashwa', client: 'Vitalis Living', note: 'Product shoot',
      cats: ['commercial', 'creative'] },

    { id: '698a375daec3d4e420be801e', v: '1770693453670', bg: '#4F4749', dur: 55, shape: 'reel',
      title: 'Lion’s Mane', client: 'Vitalis Living',
      note: 'With the Daarhi Mooch founder', cats: ['commercial', 'creative'] },

    { id: '698a7164fc23d3d76faa4d6e', v: '1770682567773', bg: '#4F5247', dur: 46, shape: 'feature',
      title: 'WASA 3D Animation', client: 'NESPAK · Government of Pakistan',
      cats: ['commercial', 'creative'] },

    { id: '69c60e23b365493ac08b0d52', v: '1774587601730', bg: '#565143', dur: 19, shape: 'medium',
      title: 'Wedding Event Highlight', client: 'DJMian', cats: ['film'] },

    { id: '69c60e23123b739cbbe5f77e', v: '1774664557244', bg: '#356458', dur: 27, shape: 'medium',
      title: 'Candlestick Men', client: 'Bullionite', cats: ['creative'] },

    { id: '69c60e23123b739cbbe5f7a2', v: '1774587641849', bg: '#595940', dur: 75, shape: 'feature',
      title: 'Sialkot Ring Road', client: 'NESPAK · Government of Pakistan',
      cats: ['commercial', 'creative'] },

    { id: '69c60e23123b739cbbe5f7af', v: '1774665026698', bg: '#4E4D4B', dur: 45, shape: 'medium',
      title: 'UFO History, Australia', client: 'Project Unknown: Field Files',
      cats: ['creative'], feature: 5 },

    { id: '69c60e23b365493ac08b0d6a', v: '1774665436598', bg: '#4E4D4B', dur: 29, shape: 'medium',
      title: 'Permission', client: 'Shadia Akle', note: 'Podcast', cats: ['film'] }
  ];

  /* The four strands the archive filters by, in the order they appear. */
  var STRANDS = [
    { key: 'all',        label: 'Everything' },
    { key: 'film',       label: 'Film' },
    { key: 'music',      label: 'Music' },
    { key: 'commercial', label: 'Commercial' },
    { key: 'creative',   label: 'Creative' }
  ];

  var CAT_LABEL = {
    film: 'Film', music: 'Music', commercial: 'Commercial', creative: 'Creative'
  };

  /* `shape` is a layout instruction, not a crop:
       reel     9:16, three across
       medium   landscape, two across
       feature  landscape, a band of its own

     The aspect a card is drawn at is the master's own — `ar` above where
     it is not the default for the shape. Nothing is ever squeezed into a
     frame it was not shot for, which is why the wide pieces are not all
     forced into one cinematic ratio: three of the four are 16:9 and only
     Lahore is 2:1, so that is exactly how they are shown. */
  /* bg: the poster's own average colour, pulled toward the ink and
   desaturated. It sits under the frame while the thumbnail is still in
   flight, so a card reads as a dim frame of ITS film instead of a black
   hole that suddenly fills in. Sampled from the real thumbnails; see the
   log for the method. */
var DEFAULT_AR = { reel: '9 / 16', medium: '16 / 9', feature: '16 / 9' };

  window.MZ_WORK = {
    lib: LIB,
    items: WORK,
    strands: STRANDS,
    catLabel: CAT_LABEL,
    /* the CSS aspect-ratio a card should be drawn at */
    ar: function (item) { return item.ar || DEFAULT_AR[item.shape] || '16 / 9'; },

    /* poster at exactly the width the slot needs, in webp */
    poster: function (item, w) {
      return LIB + item.id + '/thumbnail-1-0.png?v=' + item.v +
             '&format=webp&w=' + w;
    },
    hls: function (item) { return LIB + item.id + '/main.m3u8'; },
    mp4: function (item) { return LIB + item.id + '/download.mp4'; },

    /* "Commercial, Creative" */
    cats: function (item) {
      return item.cats.map(function (c) { return CAT_LABEL[c] || c; }).join(', ');
    },

    /* the line under the title: a client, or the reason there isn't one */
    credit: function (item) {
      if (item.client) {
        return (item.note ? item.note + ' · ' : '') + 'For ' + item.client;
      }
      return item.note || '';
    },

    /* 39 -> "0:39", 75 -> "1:15". Floored, not rounded: a 59.5s master
       would otherwise read 0:59 on its card and 1:00 in the player. */
    time: function (secs) {
      var s = Math.max(0, Math.floor(secs || 0));
      return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
    },

    featured: function () {
      return WORK.filter(function (p) { return p.feature; })
                 .sort(function (a, b) { return a.feature - b.feature; });
    }
  };
})();
