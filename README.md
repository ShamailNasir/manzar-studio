# manzar.studio

The Manzar site: Studio at the root, Labs at `/labs/`, four capability
pages and a pricing page.

Plain HTML, CSS and JavaScript. No build step, no dependencies to install —
what is in this repo is what gets served.

## Layout

```
index.html            Manzar Studio
labs/index.html       Manzar Labs
capabilities/         ai · cloud · iot · mobile
pricing.html
assets/               shared: css, js, images, video, menu frames
labs/assets/          Labs-only css and js
```

Shared across every page: `assets/css/cursor.css` (the pointer, linked
first so it resolves before first paint), `assets/css/menu.css` +
`assets/js/menu.js` (the full-screen menu), `assets/css/manzar-system.css`.

## Running it locally

Open `index.html` in a browser. It is built to work from `file://` — the
hero falls back to a base64 copy of its video so the WebGL relighting
still works without an origin.

To see it exactly as it is served, run a local server instead:

```
python3 -m http.server 8000
```

then open http://localhost:8000

## Deploying

Vercel, no configuration needed beyond `vercel.json`. Framework preset is
**Other**, no build command, output directory is the repo root.

Pushing to `main` redeploys.

## One thing worth knowing

`index.html` picks its hero source by protocol. Over `http(s)` it uses
`assets/video/hero-lights.mp4` directly. Opened from disk it falls back to
`assets/video/hero-lights.b64.js`, which is the same video base64-encoded
so it counts as same-origin and the WebGL hero keeps working. The two are
byte-identical; the base64 copy is only there for local viewing and is
never requested from the live site.
