# Studio + Labs integration log

Every change made while merging the brother's site (`website-main/`) into ours.
Each entry is revertable on request. Ours = design authority; his = selected content.

**Safety net:** `Backup/` (yours) + `index-hero-02-lights.html` (pre-integration snapshot).

| # | Change | Source | Revert to |
|---|---|---|---|
| 1 | **How We Ship steps** replaced with his exact copy ("We find the story" / "We shape it in the open" / "We ship it, then stay"). Our heading typography kept. | website-main/index.html | my general/professional rewrite (in git-free snapshot `/tmp/pre-integration.html`, and quoted in chat) |
| 2 | **FAQ** replaced with all 7 of his Q&As verbatim, incl. "Who will actually be working on our project?" and the Labs question (links to labs/index.html). Our FAQ label, layout and type kept. | website-main/index.html | my 6 researched questions |
| 3 | **Work section** rebuilt: his three projects (NESPAK, Smart HR, Amantech) replacing Smart HR/PandaVoice/photo covers. Paris photo covers removed. | website-main/index.html | previous rows using assets/work-0*.jpg |
| 4 | **Drawn frame art**: his per-project inline SVG diagrams ported, plus `.fl/.fl-dim/.fa/.fa-dot/.ft` primitives re-bound to OUR colour tokens so they invert with our bone/ink themes. | website-main/index.html | previous `.wphoto` background images |
| 5 | **Rounded frames**: `.wmedia` border-radius 2px → 16px + hairline border, matching his `--r-card` treatment in our palette. | website-main | `border-radius:2px` |
| 6 | **Work order**: NESPAK (film) placed first to honour your earlier "video project in the top slot" instruction; his order was Smart HR first. | judgment call | reorder rows in the work section |
| 7 | **Studio ⇄ Labs switch** added to the nav (pill, our type/palette, rides the nav's difference blend so it reads on both themes). Hidden under 1100px. | his `.mz-switch` concept, our styling | remove `.mz-switch` block from nav + CSS |
| 8 | **"The software side of the studio" doorway** added between Work and Services: his heading, lead and 4-item spec list verbatim, plus his Labs stats (06 weeks / 40+ / 99.9%). Built with OUR panels, type and hover behaviour, not his layout. | website-main/index.html `#labs` | delete `<section class="labs" id="labs">` + `.labs-*` CSS + spec-list JS |
| 9 | **Nav** switched from flex space-between to a 3-column grid (brand / links / right group), so the links are optically centred regardless of what sits beside them. Switch + CTA grouped in `.nav-right`. | fix | revert `.nav` to `display:flex;justify-content:space-between` |
| 10 | **Work section polish**: new `--frame` / `--frame-line` tokens give the media a distinct raised surface per theme, radius 16→18px, rows taller and vertically centred, card lifts 4px on hover. | polish | remove `--frame*` tokens, restore `background:var(--panel)` |
| 11 | **Labs doorway → dark**: added `#labs` to the theme-flip list so the section runs on ink instead of bone. | your request | remove `["#labs","ink","bone"]` from `flips` |
| 12 | **Labs button** restyled to our signature pill (solid fg with inverted arrow chip), matching "Tell us your story". Label and destination unchanged. | your request | swap class back to `btn labs-enter` |
| 13 | **Services scale**: titles 58→74px max, row padding roughly doubled, rows capped at 60% width, hover card 285→360px and pulled inboard (right offset up to 210px) so it reads correctly on 2K. | your request | restore prior clamps on `.srow`, `.srow h3`, `.svc-visual` |
| 14 | **Studio**: "The people you'll actually work with" (named individuals) replaced by his **Call sheet** — Direction / Engineering / Production, plus the spec grid (call time, location, delivery, rate) and its note. | website-main `#studio` | restore the three `.trow` entries with names |
| 15 | **Services rhythm evened**: use-case tag now floats beside the title (absolute) instead of wrapping under it, so every row keeps identical height. Row padding reduced. | your request | revert `.s-use` to static + old `.srow` padding |
| 16 | **Service images**: moved back to the right edge, rounded corners removed (radius 0), and the `S/01 · …` overlay label deleted entirely (markup, CSS and JS). | your request | restore `.sv-tag` + radius 16px |
| 17 | **Labs section stayed white — real cause**: `#services` had its scroll-back theme set to `bone`, so scrolling up repainted the Labs block. Changed to `ink`. | bug fix | set services back-value to `bone` |
| 18 | **Nav restructured**: switch moved next to the logo (left) and enlarged; CTA + new **Menu** button on the right. | your request | move `.mz-switch` back into `.nav-right` |
| 19 | **Full menu overlay**: two numbered columns, Manzar Studio (01–06) and Manzar Labs (07–12), replacing the old mobile-only link list. Opens at all breakpoints. | your request / his flight-deck menu | restore previous `.menu` block |
| — | **REVERTED my Labs rebuild.** My from-scratch Labs page was discarded; it was an overhaul, not the requested port. | correction | n/a |
| 20 | **His Labs copied wholesale**: `labs/` (index.html, his style.css, main.js, plate.js, vendor GSAP/Lenis/SplitText, images), plus the shared `assets/css/manzar-system.css` + `assets/js/manzar-system.js`, `capabilities/*`, `pricing.html`, favicon, webmanifest. His layout, sections, machine showcase, journey rail and accordions are all intact. | website-main | delete `labs/`, `capabilities/`, `pricing.html` |
| 21 | **Scroll-pop bug fixed at source**: `labs/assets/css/style.css` line 211 `height:100vh` → `100svh` on the sticky hero. `100vh` includes the space behind mobile browser chrome, so the sticky hero resized every time the address bar showed/hid. His Studio page already used `svh`; Labs was never updated. | bug fix | set back to `100vh` |
| 22 | **Theme layer** `labs/assets/css/manzar-theme.css` (new, loaded last): retires Instrument Serif and Gulzar in favour of our General Sans / Tanker stack, aligns label weight and tracking, nav/menu/switch/button type sized to ours, our shell width, our custom pointer, focus-visible rings, reduced-motion handling, and accordion max-heights that follow real content instead of a hard cap. **Deleting this one `<link>` restores his original appearance.** | your request | remove the `manzar-theme.css` link |
| 23 | Gulzar (Urdu) font requests removed from the Labs head, matching the Studio site which no longer uses Urdu. | consistency | restore the Gulzar `<link>` tags |

---

### 24. Labs menu got its own controller
**Change** Appended a `studioShellMenu` block to `labs/assets/js/main.js`: open/close, Escape, scroll lock through the shared Lenis instance, staggered link entrance, and smooth in-page jumps from both the menu and the header links.
**Why** His `MZ.menu()` binds to `.mz-menu`. Our panel is `.menu#mzMenu`, so his function hits its own guard clause and safely does nothing. Nothing was driving the new panel.
**Gotcha found** The menu markup sits *after* `main.js` in the document, so the first version bound before the panel existed. It now waits for `DOMContentLoaded`.
**Revert** Delete the `studioShellMenuBoot` block at the end of `labs/assets/js/main.js`.

### 25. Killed his legacy 430px drawer styling
**Change** Added a `#mzMenu.menu{...}` reset in `labs/assets/css/manzar-theme.css`.
**Why** `labs/assets/css/style.css` line 163 still carries an older slide-in drawer *also* named `.menu` (width `min(430px,92vw)`, `transform:translateX(102%)`, left border). It was boxing our full-screen panel into a 430px column and pushing it off-canvas.
**Revert** Delete that block.

### 26. Scoped the switch override to the header
**Change** `.mz-switch::before` neutraliser is now `.nav .mz-switch::before`.
**Why** His footer "Back to Manzar Studio" card uses the same `.mz-switch` class. The unscoped rule made its Labs pill invisible.
**Revert** Drop the `.nav ` prefix.

### 27. Footer decluttered
**Change** `labs/index.html` footer nav trimmed from 9 links to 6: About, Speed, What we build, Work, FAQ, Contact.
**Why** Ali flagged his footer as "a mess with way too many options." AI / Enterprise / Services collapsed into "What we build"; Commitments dropped (still reachable from the menu).
**Revert** Restore the nine `<a>` rows in `.fnav`.

### 28. Contact address corrected
**Change** `hello@manzar.solutions` to `hello@manzar.studio` in 7 places across `labs/index.html` (contact block, form fallback, footer, Ardenta waitlist mailto, comment).
**Why** Leftover from the old brand name.
**Revert** Reverse the replacement.

### 29. Two commitments paragraphs tightened
**Change** Commitment 01 lost a trailing clause; commitment 03 lost a redundant "because none of it was ever ours."
**Why** Both ran past 250 characters in a row layout that reads better short. Meaning unchanged.
**Revert** See this entry for the original wording in the git-less diff below:
  01 was "...in writing, and you see the new figure before anyone starts building against it."
  03 was "...as collaborators — so there is no migration at the end, because none of it was ever ours."

---

## Norvin pass

Reference studied live and written up in `NORVIN-STUDY.md`. Design decisions
confirmed by Ali: hero quality raised to Norvin's level with a new hero image,
centred nav links stay, accent held back, 20px cards and 100px pills adopted on
Labs only.

### 30. Theme layer rewritten as a system
**Change** `labs/assets/css/manzar-theme.css` rebuilt from a pile of patches into
nine numbered parts: rhythm, type, surface, colour, structure, hero, section
corrections, motion/accessibility, shell. Previous version preserved verbatim at
`labs/assets/css/manzar-theme.pre-norvin.css`.
**Revert** `cp manzar-theme.pre-norvin.css manzar-theme.css`.

Specifically:

- **Rhythm.** His page ran three competing vertical-padding formulas
  (`clamp(90px,12vh,150px)` on `.section`, `clamp(80px,11vh,140px)` on `.svc`,
  `clamp(80px,12vh,140px)` on `.return-act`) plus a hard `20px` outlier on
  `#services`. All four collapse to one scale of four values. Every block-level
  margin inside sections now references that scale instead of its own clamp.
- **No viewport-height units in layout.** Every `vh` in padding, margin and
  max-height is now `vw` or a fixed px ceiling. Viewport-height units in layout
  mean the page re-measures itself whenever the viewport height changes, which is
  one of the mechanisms behind the scroll judder.
- **Type.** 22 heading sizes and 6 near-identical body sizes with 7 different
  line-heights collapse to a 10-step scale with 4 line-heights. Leading is tight
  (Norvin never exceeds 1.25 on body; ours sits at 1.5 because our paragraphs run
  longer) and tracking tightens as size grows.
- **Surface.** Radii of 12, 14, 15, 16, 18 and 22 all become 20. Pills stay 100.
  Circles stay circles. The Studio arch stays an arch — the one exception.
- **Colour.** Accent went from roughly twenty appearances to four: the pulsing
  live dot, the "+" on the headline statistic, the lit portion of the journey rail,
  and selection/hover chips. Everything else moved to a four-step grey ramp.
  Three accent-tinted background glows were neutralised to bone.
- **Structure.** Added the guide-line layer: three hairline verticals fixed behind
  the whole page. His hero already had the idea; Norvin runs it the full height and
  it is what ties twenty screens of scrolling into one drawing.
- **Hero.** `.hero` was pinned in `vh` while its sticky child was sized in `svh`.
  Both are `svh` now.

### 31. Reference study recorded
**Change** New file `NORVIN-STUDY.md` — measured palette, type scale, radii,
vertical rhythm, section grammar and the specific reasons the reference reads as
high quality. Everything in it was read off computed styles in the live page, not
estimated from screenshots.

---

## Round two — bug fixes and section rework

### 32. Scroll drift: root cause found and fixed
**Diagnosis** Instrumented the live page. Static layout is stable — a full scroll
walk moved no section by a single pixel and the document height never changed. So
the drift was never a reflow. Enumerating GSAP showed **19 ScrollTriggers, all 19
scrubbed**, running on top of Lenis configured with `lerp: 0.09`.

`lerp: 0.09` is a very slow catch-up: the page keeps gliding after the wheel stops.
Every scrubbed animation then trails that already-lagging position by a further
0.4s. Reverse direction and all of it unwinds with the same double lag. That is the
content "shifting or relocating slightly" — two smoothing systems stacked.

**Change** `labs/assets/js/main.js`:
- Lenis now uses the Studio page's exact config (`duration: 1.15` with an expo-out
  easing) instead of `lerp: 0.09`. Both sites now scroll identically.
- `scrub: 0.4` to `0.65` in four places, inside Studio's own .6 to .8 range.
- Hero shell settle: `scale 0.9` to `0.965`, radius `32px` to `20px`. A 10% shrink
  on a full-bleed hero is itself readable as the layout resizing.
- Image parallax: travel `±7%` to `±4.5%`, scale `1.16` to `1.10`.
**Revert** `cp assets/js/main.pre-scrollfix.js assets/js/main.js`.

### 33. Marquee loop
**Change** Rewrote `marquee()`. It wrapped at `scrollWidth / 3`, which assumes the
markup repeats its phrases exactly three times — the location band repeats four, so
it wrapped at the wrong distance and snapped to zero every cycle. It now collapses
whatever the markup contains into one measured unit, clones it until it covers twice
the visible width, and wraps on the measured width with a modulo so a dropped frame
cannot overshoot. Re-measures after webfonts load and on resize.

### 34. Section names
"Speed" was a claim, not a destination, and one section carried three different
names: "What we build" in the nav, "Services" on the eyebrow, "What we're for" as
the headline.
- Speed becomes **Timeline** (nav, eyebrow, footer). It is a week-by-week schedule.
- The capabilities index: eyebrow **Capabilities**, headline **What we build**,
  nav **What we build**. Nav label and headline now match.

### 35. Eyebrow chrome removed
Eyebrows were pills — rounded box, border, tinted fill and a dot, four pieces of
chrome to deliver one word. Now plain tracked-out uppercase with the dot, matching
both Norvin and the Studio page.

### 36. Ghost numerals redesigned
The section numbers were set up to 460px and sat directly behind the heading, so
"05" and "Design Systems" fought for the same pixels. Same markup, now a small mono
index above the title. The title no longer needs its clearance padding.

### 37. Guide lines confined to the hero
They ran the full page and cut through content below the fold. They stop with the
hero now.

### 38. AI transcript rebuilt
Was a flat stack of four bubbles in a very wide box. Now a device: titled bar with a
live dot and an environment chip, the thread at a readable measure, high-contrast
user bubbles against quiet system ones, the gated reply marked in vermilion, and a
footline stating the rule the transcript demonstrates. Copy tightened.

### 39. How we work
Was an unattributed claim over an unrelated stock photograph. Now a signed position:
Uzair's portrait, the statement as a pull quote, his name against it, and three
facts underneath. **OWNER INPUT NEEDED** — the attribution reads "Uzair — Founder,
Manzar"; I could not verify a surname or exact title.

### 40. Footer wordmark
Labs was setting its own lockup in type (Urdu mark, lowercase "manzar", a chip)
while Studio uses the drawn wordmark. Labs now uses `assets/manzar-wordmark.png`
with a Labs chip, tinted for the dark half of the band. Footer nav label synced.

### 41. Menu rebuilt on his architecture
**This is the one I got wrong twice.** His flight deck is back: a glass sheet that
drops from under the header, three numbered groups of rows each with a description,
a live preview panel that swaps image, kicker and caption as you move down the rows,
and a foot bar carrying the world switcher, the address, both clocks and the CTA.

Because the panel is `.mz-menu` again, `MZ.menu()` binds to it and his focus trap,
scroll lock, image preloading and the `--mfs` auto-fit that scales the rows to the
viewport all come back. My replacement controller in `main.js` is deleted.

The skin is entirely ours: our type scale, our grey ramp, our radii, our header
sizing, the accent rationed to the hover arrow. Structure his, surface ours.
Content is Labs-specific and uses the new section names.
**Verified** opens, locks scroll, morphs the trigger, swaps the preview on row hover
(row 08 loads work-01.jpg, kicker "Selected work"), closes on Escape and releases
the lock.
**Revert** `cp index.pre-menu.html index.html`.

---

## Round three

### 42. The drifting layout — actual root cause, fixed at the architecture
**Diagnosis** Measured live: of 70 revealable elements, **70 were holding a
transform**, and every element already scrolled past sat frozen at
`translateY(34px)` — mid-animation, never completing.

The reveals were `gsap.fromTo(el, {y:56, opacity:0}, {...})` driven by
ScrollTrigger. That makes an element's *layout position* depend on a JavaScript
tween running to completion. A tween only completes if the ticker keeps running,
so background the tab, drop frames on a heavy section, or scroll faster than the
1.25s tween and elements freeze part-way — content parked up to 56px low,
lurching whenever an animation resumed. Retuning the animation could never fix
this, because the animation *was* the layout.

**Change** The offset moved into CSS and an IntersectionObserver adds one class.
A CSS transition cannot stall: once `.is-in` is set the element **will** land at
translate zero regardless of frame rate or tab state. Plus:
- The stylesheet's default is visible and in place, so if the observer never runs
  the page is correct rather than blank.
- A throttled scroll sweep catches anything the observer missed (hash jump,
  restored scroll position, very fast flick), which otherwise stays invisible.
- The hero intro and the reduced-motion branch use the same class.
**Verified** after a full scroll walk: elements above the viewport still holding an
offset went from **70 to 0**.
**Revert** `cp assets/js/main.pre-reveal.js assets/js/main.js`.

### 43. Buttons — the Studio vocabulary
Labs used pills with circular chips. Studio uses a rectangle at 2px radius with an
arrow that slides up-and-right on hover, and a 7px square chip on the header CTA.
Applied across every Labs button: `.btn`, `.btn-light`, `.btn-ghost`, the form
submit, the header CTA and the menu foot CTA.

### 44. Emphasis
The accent words were set in a faux italic of a face that has no italic, so they
leaned into the following word and read as broken. Studio carries no serif at all —
it emphasises with weight and brightness. Same device now on Labs.

### 45. Image caption removed
`frame 0214 · the cutting room` deleted. Audited the rest: no other image carries a
caption overlay and no CSS prints text over media.

### 46. Eyebrows matched to Studio
Labs' label was 11px in grey against Studio's 13–15.5px in near-white. Side by side
the Labs one read as an afterthought. Now identical to Studio's `.eb`.

### 47. Section numbering — Norvin's real treatment
I had over-corrected into a tiny label. Measured the reference properly: **372px,
weight 800, near-black on near-black, and critically in flow rather than absolutely
positioned behind the heading** — which is why his original collided with the title.
Now a large tonal numeral in flow above the title.

### 48. AI transcript rebuilt as a product
The brief was that a client should look at it and want one. Added an identified
assistant with an avatar and a live connection state, timestamps, a
"held for approval" tag that reads as a feature rather than an error, and a
composer bar. The composer does most of the work — without it the block is a
picture of a conversation; with it, it is a picture of software.

### 49. Studio ↔ Labs crossover
**Root cause of the broken switch:** `manzar-system.js`, which contains the entire
crossover-curtain system, was only ever loaded on Labs. Labs played a transition
out and Studio arrived with nothing to receive it.

**Not Barba.** Barba swaps the incoming page's DOM without running its scripts.
Studio is a single file whose hero is WebGL driven by a large inline script that
assumes a fresh document; swapped in by Barba it arrives dead, and making it
re-runnable means restructuring the one page that is already finished. See the
comment at the top of `assets/js/crossover.js`.

**Change** New `assets/js/crossover.js` + `assets/css/crossover.css`, loaded by both
pages. The outgoing page wipes a curtain up over itself carrying the wordmark and
the destination room, navigates, and the incoming page paints the curtain already
covering and continues the wipe in the same direction — one movement, no white
flash, no jump. Triggered by `data-world` on any link, which is now on both nav
switches and the Labs return CTA.

**Fail-safe:** a stranded curtain is a black screen, so nothing depends on one
mechanism. The lift and the removal each have an unconditional timer behind them,
there is a 3.2s absolute ceiling after which the curtain is torn out regardless of
state, and returning to a backgrounded tab mid-transition forces it.
**Revert** delete the two files and the four `<link>`/`<script>` lines.

### 50. Buttons — corrected against Studio's measured values
**What I got wrong** Ali asked for the Studio button. I read "square or rectangle"
as being about the *button* and flattened everything into a bare 2px rectangle with
the chip deleted. He meant the **chip** — the dark rounded square that sits inside a
light button. Removing it threw away the one detail that makes the button Manzar's.

**Measured off the live Studio page** (`.nav-cta`, the button he pointed at):

| | value |
|---|---|
| button | 56px tall, radius **9px**, padding `10px 10px 10px 24px`, gap 14px, weight 500 |
| chip | **36 x 36**, radius **7px**, `#0B0A08` fill, bone arrow |

**Change** One button definition in PART 7c of `manzar-theme.css`, applied to every
button on Labs — `.btn`, `.mz-btn` and `.nav-cta` share the same rule. Two variants
only: light (bone button, dark chip) and ghost (outlined button, outlined chip that
fills on hover). `min-height:56px` so Labs and Studio measure the same.

**Two overrides were fighting it and are gone:**
- PART 9 was re-styling `.nav-cta` as a 100px pill with a `50%` circular chip. That
  was the circle in his first screenshot.
- PART 3 had `.btn` and `.nav-cta` in a shared `border-radius:var(--r-pill)` list.
  Pills are now for the world switch and tags only; buttons are defined once.

**Verified** all 8 buttons on the page report `border-radius: 9px` with a `7px` chip.
Zero inconsistencies.

### 51. Section numbering — the overlap, which is the whole device
**What I kept missing** On the reference the heading sits **on top of** the numeral.
The numeral is a huge ghost behind the type and the title crosses its lower third.
That overlap is the effect: two elements reading as one composed object with depth.
I had stacked them — numeral above, title below — which is the same parts with no
design, and is why it kept reading as "just simple numbering".

**Change**
- `.svc-head` is centred, as the reference is, with top padding reserving the
  ghost's room so the title overlaps it rather than clearing it.
- `.svc-ghost` absolutely positioned, centred, `clamp(190px, 23vw, 470px)`,
  line-height .78, at 5.5% bone — large enough to dominate, faint enough to sit behind.
- `.svc-title` raised to `clamp(46px, 7vw, 132px)` and pulled to a 16ch measure so it
  sits across the numeral's waist.
- A hairline drops out of the header into the content below, tying the centred block
  to the left-aligned material it introduces.

**Bug found while doing it** `.svc:nth-of-type(even) .svc-ghost{left:auto;right:0}` in
his stylesheet alternates the ghost left/right per section, which threw the
even-numbered ones off centre. Both offsets are now pinned. Verified: all five
sections report ghost, title and header centres identical to the pixel.

**Second instance of the drift bug, removed** `style.css` also hides `.svc-title` and
`.svc-ghost` with `.js{opacity:0}` and parks the title 60px low, relying on a tween to
restore them — the same pattern that had the page sitting 34px out. The animations set
their own start values, so those defaults were pure risk: a tween that never runs
leaves the heading invisible. Neutralised. The `.svc-sub` tween, which parked the sub
36px low, is retired in favour of the CSS reveal system.

### 52. Inline index numerals quieted
`.reg-n` and friends were vermilion. Five red numbers in a row under a heading pull
harder than the heading. Moved to the grey ramp, consistent with the accent rationing.

### 53. Service headers — the lines removed, the block made to feel alive
**The lines were mine, and they were wrong.** I had added a hairline above the
numeral and a vertical drop below the sub. Neither had a job; they read as artifacts.
Both removed.

**Researched first:** Norvin's numerals carry no scroll motion at all — the wrapper is
`opacity:0.3` with pure black text and a static centring transform, sampled across six
scroll positions to be sure. So there was nothing to copy, and the life had to be
designed rather than borrowed.

**Three changes, all of which leave layout untouchable:**

1. **The numeral is lit rather than flat.** A vertical gradient clipped to the glyph —
   12.5% bone at the top falling to 1.4% at the foot — so it reads as a form catching
   light instead of a grey shape sitting on black.
2. **It drifts against the scroll.** The numeral travels slower than the page, so the
   heading appears to slide across it as you move through the section. That speed
   difference is the whole reason a large background element reads as part of a space
   rather than a sticker on it. Verified: 66px of travel across the section's range.
3. **A soft bloom behind the header**, so the section arrives out of light rather than
   off a flat plate.

Centring moved from `translateX(-50%)` to `text-align` on a full-width box, which frees
the transform for the drift to own outright.

**Safety:** the numeral is absolutely positioned, so it cannot move anything else. The
title's document position was sampled across five scroll positions and does not vary by
a pixel. This is the discipline the earlier drift bug taught: animate only things that
are out of flow.

**Bug found while doing it.** A stale rule from my earlier tiny-label attempt was still
in the stylesheet. PART 7f overrode most of it, but that old block carried
`transform:none !important` — which PART 7f does not set — so it silently won and the
drift never applied even though GSAP was writing the values correctly. This is the
second time a superseded rule of mine has kept working from further up the file; both
are now deleted rather than overridden.

### 54. Mission section
**The "M"** was `<svg class="mission-glyph">` — a decorative Manzar monogram parked at
the section's right edge with no relationship to anything. Removed from the markup.

**The emphasis** was too heavy. My earlier fix set accent words to weight 600 in full
bone, which inside a 16px grey paragraph read as a shout — heavier than the heading
above it. Emphasis should be a change of brightness, not of mass: it is now one step of
weight (500) and a lift to bone, which makes it the brightest thing in the sentence
using the same two-tone logic as the headline.

**Proportion.** The image was about 8% of the measure against a 58px headline, so the
two had no relationship. It is now 26% with the section's card radius and a hairline
border. Caught and corrected mid-change: capping the whole copy column at 34ch turned
the three-line statement into a seven-line ribbon — only the supporting text is
constrained now, and the headline runs to 22ch.

**The stats row** was four numbers floating on a single hairline. Now ruled columns with
a gradient divider between each, and they arrive in sequence — the stagger is CSS
`transition-delay` on the reveal class, so it inherits the same guarantee as the rest of
the page and cannot stall part-way leaving a number sitting low.

**Two-tone headline** made explicit: `.line-a` bone, `.line-b` grey. It was relying on
his markup order rather than being stated.

### 55. Typography matched to Studio
Measured Studio's live type rather than guessing. Its signature, by a wide margin —
62 instances — is **58px / weight 500 / -0.022em / line-height 1.1**. Weight *five
hundred*, not six. That one value is most of why Studio reads composed and Labs read
heavy: Labs was running 600 and 700 at -0.045em, a denser and more compressed voice.

Labs now uses Studio's vocabulary at its own scale: display and section headings at
500, mid-level statements at 600, body at 16.5/400/1.6, labels at 600/.15em. Tracking
is one consistent value per tier instead of tightening hard as size grows.

The hero wordmark went from 700/-.055em — a heavy condensed slab — to 500/-.032em. The
same word now reads as a mark rather than a shout, which is how the Studio page carries
its own name.

### 56. The timeline track
Four plain columns became a track that draws as you scroll: a rail fills, each week's
node lights as the fill reaches it, and passed weeks lift out of grey. It speaks the
same language as his journey rail in section 01, so the page argues with itself less.
Driven by one 0-to-1 custom property; everything downstream is a scaleX or a colour.

### 57. Cards answer the pointer
A light follows the cursor across the design-system and enterprise cards. One custom
property write per frame, only while the pointer is over a card, and the handler reads
no layout — so there is nothing here that can force a reflow mid-scroll.

### 58. Work section deliberately left alone
Flagged as an upgrade candidate, then inspected: it is a laptop drawn in the site's own
language with a **live iframe** running Smart HR, reels either side, a lid that hinges
on scroll and a status HUD. Replacing it with a Norvin-style project grid would have
been a downgrade in ambition. Left as his.

### 59. Verification for this round
- Timeline fill tracks scroll linearly (0.0000 / 0.2506 / 0.5012 / 0.7494 / 1.0000)
  with weeks lighting 1 → 4 in sequence.
- Full-page scroll sweep: **0 sections moved**. Every effect added this round animates
  either an absolutely-positioned element, a scaleX, or a colour.

### 60. Timeline track — why it was invisible, and the fix
**Measured cause:** the animation's entire scroll range was **423px, a third of one
screen**. At reading speed it completed in a handful of frames, so there was genuinely
nothing to see. It was not a styling problem.

**Fixes**
- Anchored to the `#speed` section rather than the four columns, `top 95%` to
  `bottom 35%`. Range is now **1.4 screens** — it unfolds as you read.
- Added a **travelling head**: a glowing dot with a comet tail that runs the rail. The
  head is what the eye actually follows; a fill alone is too passive to register.
- Nodes go hollow → filled with a ring, scaled up on a spring, as the head reaches them.
- Each week's label, heading and body lift out of grey once passed, so progress is
  legible even in a still frame.

**Two bugs found and fixed while verifying**
- The head never moved: `translate: 45%` resolves against the *dot's own 10px width*,
  not the rail. Changed to `left: calc(var(--vfill) * 100%)`. Head now travels
  429 → 1276 → 2121px across the rail.
- Nodes sat 15px below the line. `.vel-step` carries its own 30px padding on top of the
  track's 68px, so the offset could never be hard-coded. It is now measured at runtime
  into `--rail-offset` and re-measured on font load and resize. Misalignment: **1px**.

### 61. Cards — spotlight border replaces the pointer wash
The wash across the card face read as a smudge: too diffuse to feel deliberate, too
vague to feel engineered. Replaced with the treatment Linear, Vercel and Resend use,
which is the right register for a software studio: **the card's own 1px border
brightens only where the pointer is**, using `mask-composite` to clip the gradient to
the border itself — so it is genuinely the edge lighting up, not a glow behind the
card. Precise instead of soft.

Supporting: a whisper of interior light well under the border so the edge stays the
subject, a 3px lift, and the icon brightening and rising slightly. Disabled entirely on
touch devices.

### 62. BREAKAGE — class-name collision, and the audit that should have come first
**What broke** I named the timeline's travelling dot `.vel-head`. That is already his
class for the Timeline's **section header grid**. My rule —
`position:absolute; width:10px; height:10px` — collapsed his entire header into a 10px
box, which is why "Six weeks to live" and its paragraph tore loose and floated over the
hero.

**Fix** Renamed to `.mz-track-head` in both the stylesheet and `main.js`. His
`.vel-head` rule is untouched and his header measures 2416px wide again.

**This was the third collision of the same kind** — `.menu` (his retired 430px drawer),
`.mz-switch` (his footer switcher), now `.vel-head`. Three times I introduced a name
without checking whether his stylesheets already owned it. So rather than fix and move
on, I wrote an audit that extracts every class this project creates in JavaScript and
diffs it against every class his stylesheets define.

**It found a second, live collision I had not noticed:** `html.mz-crossing`. His
`manzar-system.css` uses it for a first-paint ink shim and `MZ.arrive()` removes the
class on its own timer — and `manzar-system.js` **is** loaded on Labs. My crossover
curtain was using the same class for its scroll lock, so his script could silently
release my lock mid-transition, and his `::before` shim could stack over my curtain.
Renamed mine to `mz-xover`.

**Rule going forward:** any class introduced by this project is either namespaced
`mz-` and verified absent from his CSS, or it is not introduced. The audit script is
in the log history and can be re-run at any time.

**Verified after the fix**
- 15 sections, **0 overlapping pairs**, **0 collapsed sections**
- horizontal overflow: 0
- his `.vel-head` header: 2416px, `display:grid`, two columns, `position:static`
- the track dot exists separately and travels the rail

### 63. The two sections were telling the same story — resolved
**The duplication was real.** `#speed` carried a four-week track (Week 01 Scope locked →
Week 06 Live) and `#svc-01` carried a five-stop journey (Week 0 Validate → 90 days On
call). Same weeks, same scroll-driven rail, same argument, told twice — and 01's version
is strictly better because every stop also names what you leave with.

**Resolution: one section owns the timeline, the other owns the reason.**
- `#svc-01` keeps the journey. It is the richer of the two and it belongs inside the
  capability sequence.
- `#speed` loses the track entirely. What remains is the part only it has: the claim,
  and the four mechanics that make six weeks possible. Those were a cramped footnote
  under the track; they are now the body of the section, set as numbered statements at
  30px on hairline rules.
- Renamed throughout — nav, eyebrow, footer and menu — from "Timeline" to
  **"Why we are fast"**, because the section is no longer a timeline and the old label
  now pointed at the wrong idea.

Dead rules for the removed markup (`.vel-track`, `.vel-step`, `.vel-wk`) deleted rather
than left to match nothing, and the track's controller removed from `main.js`.

### 64. Paired parallax on the capability headers
Ali asked for the numerals and their headings to move against each other. They now
travel at two rates: the header drifts ±18px one way, the ghost ±88px the other,
giving **176px of relative travel** — the type visibly slides across the number as the
section passes. Two planes at two speeds is what reads as depth; one element moving
alone just reads as a thing that moves.

**Two GSAP traps hit and worked around, both the same root cause:** GSAP writes
`translate:none` inline onto any element it targets, which silently kills a CSS
`translate` on that element.
- First attempt animated the title directly — dead, because the title is already a
  GSAP target for its line-mask reveal.
- Second attempt animated the custom properties on `.svc-head` and had the header carry
  the drift — also dead, because animating the properties made the header a target too.
- Working version animates the properties on the **section**, which is only ever a
  trigger. The header and the ghost inherit the values and keep CSS ownership of their
  own transforms.

The numbers are written as custom properties rather than as GSAP transforms
deliberately: CSS keeps ownership of each element's resting position, so a tween that
never runs leaves the header exactly where the stylesheet put it. That is the safeguard
the drift bug bought us, applied on purpose.

**Verified:** 0 sections moved across a full-page scroll sweep, 0 overlaps, 0 collapsed
sections, no horizontal overflow.

### 65. Timeline restored, and the two sections separated on a different axis
I had removed the "Six weeks to live" track to kill the duplication. Ali wanted it
kept — it was the better call, and cutting a working feature to solve a copy problem
was the wrong instinct. It is back in full: the four dated milestones, the rail that
draws, the travelling head, the nodes lighting in sequence. Named **Timeline** again
across nav, eyebrow, footer and menu.

**The duplication is now solved by axis, not by deletion.** The two sections were both
answering "when". They now answer different questions:
- **Timeline** — *when things happen.* Four dated milestones and the four mechanics
  that make the dates real.
- **Section 01, From idea to launched** — *what it asks of you.* Every stop already
  said what you leave with; each now also carries a **Your part** line stating what we
  need from the client at that stage. Ninety minutes and an honest answer. One
  decision-maker named. Thirty minutes on a Friday. That is the question a founder is
  actually asking, and the Timeline cannot answer it.

### 66. Parallax reversed and intensified
Direction was wrong: the planes drifted apart on scroll down. They now travel **toward
each other** and meet as the section reaches the middle of the screen — the moment you
are reading it. Amplitude roughly doubled: ghost ±130, header ∓34, giving **328px of
relative travel** against 176px before. Measured gaps across the pass: 535 → 371 → 207.

### 67. Chat widened
`.ai-chat` from 600px to 820px, and the lead grid re-weighted to .85fr / 1.15fr so the
column can actually hold it.

### 68. One button, everywhere
The outlined secondary variant is gone. Every button on the page is now the light one —
bone field, ink label, dark chip — the same object as "Start a project". Mixing two
button weights across one page was doing nothing for it.

### 69. Card hover — the edge only
The interior wash is removed entirely. Lighting the face of a card muddies the copy
sitting on it and reads as a smudge rather than a finish. The whole effect is now the
rim: the border brightens to near-white silver where the pointer is, masked to the
1px edge with `mask-composite`. The card face is identical at rest and on hover. The
icon response is untouched — that part was already right.

**Verified:** 0 sections moved across a full-page sweep, 0 overlaps, 0 collapsed
sections, no horizontal overflow, 5 "Your part" lines rendering.

### 70. The numeral now actually sits behind the heading
**Measured cause of the gap.** His rule is `top:50%; transform:translateY(-50%)`. My
`top:0` was winning but his **transform was not being neutralised**, so the glyph was
hoisted half its own height — 183px — above the header and never met the title. Measured
overlap at the resting position was **-5px**: they were not touching at all, which is why
the number always floated clear above the text.

I could not simply re-add `transform:none` earlier in this project because that was the
stale rule that killed the drift. It is safe now for a specific reason: the parallax
drives the separate **`translate`** property, not `transform`, so neutralising one leaves
the other untouched. This is only true because of how the parallax was rebuilt in entry 64.

**Change** `transform:none` on the ghost, plus `top:clamp(26px,3.2vw,64px)` to seat it
lower so the heading crosses its body rather than clearing it.

**Result at the resting position, identical across all five sections:**
numeral 64 → 431, title 188 → 436. The title now covers **98% of its own height** against
the numeral, with 124px of the numeral reading above it — the number sits behind the type
exactly as on the reference.

**Checked for bleed:** at the extreme of the parallax the numeral extends 24px past the
header's box, but the header's bottom margin is empty and the next element still clears it
by 69px at every point in the travel. No collision.

**Verified:** 0 sections moved, 0 overlaps, 0 collapsed, no horizontal overflow.

### 71. Seat corrected — a third behind, not all of it
I overshot. At +64px the numeral was buried: 98% of the heading's height sat against it
and only a sliver of the figure read above. The reference has the heading crossing the
numeral's **lower third**, so about two thirds of it still reads.

Worked back from the geometry rather than nudging: the title top is fixed at the
header's 188px padding and the glyph box is 367px, so two thirds above means the glyph
must start about 54px **above** the header edge. `top:clamp(-72px, -2.1vw, -28px)`.

**Measured at centre, identical across all five sections: 65% of the numeral above the
heading.**

### 72. Parallax rebuilt as a curve, not a ramp
The old version was a straight A-to-B tween. That is what made it feel mechanical: one
constant speed, and the section's centre — the moment you are reading it — marked in no
way at all.

Two curves now run off one progress value:
- **travel** — linear and converging. Ghost and type close toward each other and meet as
  the section reaches the middle of the screen. Amplitude raised to ±150 / ∓38.
- **presence** — a smoothstepped triangular curve peaking dead centre. The numeral swells
  4.5% and lifts from 50% to full brightness as it arrives, then recedes. That peak is
  what makes the section feel like it *arrives* rather than merely passes.

Scrub lengthened to 1.25 so the numeral visibly trails the scroll, which is what reads as
weight on a large background element. Safe to lag because nothing here touches layout —
translate, scale and opacity only, all on an absolutely positioned glyph, all written as
custom properties so CSS keeps ownership of the resting position.

**Verified:** 0 sections moved, 0 overlaps, 0 collapsed, no horizontal overflow, and all
five headers report the same 65% seat.

### 73. The belts — real keywords, and only written once
**Content.** The light band read "Precise engineering / Cinematic craft / Honest
timelines" — Studio's vocabulary on a software page, and the middle one is a film term.
Replaced with claims this practice can actually defend:

  Shipped, not prototyped · Fixed price, fixed date · You own the code ·
  Live in six weeks · Production, not demos · One team, no handoffs

The dark counter-band moves from three place names to six operational facts:
Lahore · Paris · Worldwide · Since 2019 · Remote-first · Nine countries — the last tying
to the "9 countries" figure already claimed in the mission stats.

The top ticker gains SaaS Platforms, Mobile and Design Systems, so it covers the whole
practice rather than four of its seven capabilities.

**Written once.** Since the marquee rewrite in entry 33 collapses whatever the markup
contains into one measured unit and clones it to fill, the phrases no longer need
hand-repeating three or four times. Each band is now a single set. Spacing between
phrases widened, because these are sentences rather than the single words the belt was
built for and they need room to read at speed.

### 74. How we work — his voice, and stats that stand up
**The quote** was accurate but flat. Rewritten toward how a founder actually says it:
"You will not be handed to an account manager. The people who scope your project are the
ones who write it, and they stay in every call until it is live." / "And if a date is
going to slip, you hear it the week we know. Not week eleven."

**The stats.** "6 engineers, all senior" removed as instructed — it also invited the
exact question a small studio does not want asked. The replacements are the kind an
agency is actually judged on:
- **70%** of new work comes from clients already shipped for — the single most
  persuasive number an agency can show. **OWNER INPUT NEEDED: confirm before launch.**
- **90** days on call after every launch, included — already promised in the
  commitments, so the page now agrees with itself.
- **2** studios, one team across both — restates the section's own headline as a fact.

**Design.** The row picks up the ruled-column treatment from the mission stats so the
two stat rows read as the same object, and the `%` rides smaller and quieter than the
figure it belongs to.

**Verified:** 0 sections moved, 0 overlaps, 0 collapsed, no horizontal overflow, all
three belts still cover twice their container so the loop stays seamless.

### 75. Belts: keywords, not slogans
My last pass wrote claims — "Shipped, not prototyped", "Fixed price, fixed date". Those
are sentences, and a belt moving at speed is the wrong place to ask anyone to read one.
They also said nothing about *what the studio does*, which is the job of a keyword.

The three belts now divide the vocabulary rather than repeating it:
- **Ticker** (top, by the hero) — the service lines: AI Products, Enterprise & ERP,
  IoT & Connected Systems, SaaS Platforms, MVP Sprints, Mobile, Design Systems.
- **Light band** (mid-page) — the technical vocabulary around them: Cloud Native,
  Automation, Integrations, Data Platforms, Product Design, API Engineering, DevOps,
  Machine Learning.
- **Dark counter-band** — place and standing: Lahore, Paris, Worldwide, Since 2019,
  Remote-first, Nine countries.

One or two words each, so they land at scroll speed and each one is a term a client
might actually search for.

### 76. Deadline line restored
"And if a date is going to slip, you hear it the week we know. Not week eleven." reverted
to the original: **"If a deadline is wrong you hear it in week one, not week eleven."**

**Verified:** all three belts still cover twice their container, loop stays seamless.

### 77. The crossover section
**The preview was a stale JPEG.** `studio-preview.jpg` showed Studio's *old* hero — the
Eiffel Tower frame with the MANZAR wordmark — which stopped being the Studio hero when it
became the village-lights film with "Attention is the hardest thing to earn." A screenshot
of a site that keeps changing will keep going stale.

I could not capture and write a new one: the browser tools return a screenshot to me but
expose no path I can save into the project.

**So the preview is now Studio's hero rebuilt in markup** — same eyebrow, same headline,
same supporting line, the same drawn wordmark asset, over a bokeh built from layered
radial gradients rather than a photograph. It cannot fall out of date, it stays sharp at
any size, and it costs nothing (Studio's real hero carries a 14MB base64 video, so a live
iframe was never an option for a thumbnail).

**Browser chrome around it** — three dots and a `manzar.studio` address pill. That states
"this is another website" more plainly than any caption, and it is the same instinct as his
Work section, which draws a laptop in the site's own language rather than photographing one.

**A different room.** The section now sits on `#171613` against the page's `#0B0A08`, with
a warm lift from the top and a hairline top and bottom. Measured side by side so the
difference is deliberate rather than accidental. The content is centred, the ghost Urdu
mark quieted for the lighter surface, and the frame lifts on hover.

**Bug found and fixed while building it:** his stylesheet carries
`.return-preview img{width:100%;height:100%;object-fit:cover}` from the old single-image
markup. That is more specific than a bare class selector, so it stretched the wordmark to
fill the frame and cropped it into nothing — the mark simply vanished. My rule is now
scoped to `.return-preview .rp-mark` to outrank it. Same category as the earlier
collisions: his CSS still describing markup that no longer exists.

**Verified:** 0 sections moved, 0 overlaps, 0 collapsed, no horizontal overflow, section
background `rgb(23,22,19)` against page `rgb(11,10,8)`.

### 78. Crossover section — three corrections
**1. The notch dividers.** `.mz-notch` — his stepped hairline — wrapped this section top
and bottom. Removed from `#studio-return` only; the three elsewhere on the page are
untouched.

**2. The eyebrow was still a boxed pill.** I had de-boxed `.pill` several rounds ago but
this section uses his `.mz-eyebrow`, a different class carrying its own
`padding:8px 16px; border:1px solid; border-radius:pill`. It was the only outlined
eyebrow left on the page. Now folded into the same rule as `.pill`: plain tracked
uppercase with the accent dot. **Audited: 0 boxed eyebrows remain anywhere on the page.**

**3. The browser chrome came off.** The dots and the address pill were meant to say
"another website", but they made it read as a screenshot *of a browser* rather than a
piece of Studio. Gone. What is left is a large clean plate — the hero itself, depth from
shadow rather than a border, a single hairline of light along the top edge only, lifting
on hover.

**Sizing.** The plate was still 720px because his `.return-inner` caps the whole block at
that width. Correct for the text, strangling for the plate. The cap is lifted and the text
measures are now set per element instead — title 20ch, lead 48ch — so the copy stays
readable while the plate runs to **1180px**, centred.

**Verified:** 0 sections moved, 0 overlaps, 0 collapsed, no horizontal overflow,
0 boxed eyebrows remaining, 0 notches inside this section, plate 1180px and centred.

### 79. The crossover as a lit stage
**Urdu mark removed.** `.return-ghost` deleted from the markup and its rule from the
stylesheet — not hidden, removed, so nothing stale is left describing it.

**Why the contrast was weak.** A flat panel behind a flat plate gave two rectangles of
nearly the same value. Raising one of them would only have made a slightly less flat pair.
Contrast is a *range*, so the section is now built as a room with a light in it:

- **Surface** lifts to `#1A1916`, a clear step above the page's `#0B0A08`, warm rather
  than neutral.
- **Bloom** behind the plate, brightening and swelling as the section reaches the middle
  of the screen, so the plate arrives out of light instead of sitting on a slab.
- **Vignette** darkens the corners, pushing the eye inward and widening the distance
  between the darkest corner and the lit centre — which is what contrast actually is.
- **Plate** drops to `#070605`, further from the surface than it was.

Measured: surface `rgb(26,25,22)` against plate `rgb(7,6,5)`.

**Depth, three planes at three rates.** One moving layer is just a moving layer; depth
comes from the differences between them. As the section passes, the bloom takes 0.30 of
the travel, the plate the full amount, and the type −0.42 of it — moving against the
other two. Verified at the end of the pass: plate `+62px`, type `−26px`.

`--rp` runs a smoothstepped curve peaking dead centre, driving the bloom's brightness and
scale, so the section has a moment of arrival rather than a constant state.

Written as custom properties on the section, never as GSAP transforms — GSAP writes
`translate:none` onto anything it targets, which would silently kill the CSS translate all
three layers depend on. That is the third time that trap has come up, so it is now the
default approach rather than a discovery.

**Verified:** 0 sections moved, 0 overlaps, 0 collapsed, no horizontal overflow, Urdu mark
absent, and **0 children escaping the section** — the bloom is fully contained by the
existing `overflow:hidden`.

### 80. The visible ovals — why they happened, and the fix
Ali could see distinct elliptical shapes in both the section background and inside the
plate. He was seeing exactly what was there.

**The cause.** A radial gradient sized to sit *inside* its frame always shows you its
ellipse. Softening the stops does not help — a soft-edged oval is still an oval, and on a
near-black field the eye locks onto that boundary immediately. Inside the plate I had also
tried to stand in for Studio's bokeh film with three tinted radial blobs, which is simply
three blobs, and read as exactly that.

**The fix, three rules:**

1. **No gradient stop may terminate inside the frame.** The remaining radials are 150–160%
   wide and anchored *off* the edge (`at 50% -14%` above the section, `at 50% 112%` below
   the plate), so only their long tails are ever visible and there is no boundary on
   screen to find.
2. **Linear gradients do most of the work**, because a linear gradient has no shape to see.
3. **The vignette is an inset box-shadow, not a radial.** A shadow follows the rectangle it
   sits inside, so it darkens four edges evenly and cannot draw an ellipse across the middle.

The three fake bokeh blobs are deleted outright. The plate is now a field falling from
slightly lifted at the top to true black at the foot, with one enormous off-frame glow
seating the wordmark in warmth.

**Grain added** over the plate at 5% overlay. Dark gradients band into visible rings on
8-bit displays; noise is the standard fix and the site already uses the same technique
globally.

**Verified:** no radial gradient with a stop inside the frame remains on the section
(regex-checked against computed styles), the vignette is confirmed an inset shadow, and
0 sections moved / 0 overlaps / 0 collapsed / no horizontal overflow.

### 81. The band across the foot of the plate
Not a gradient problem — a geometry one, and I found it by measuring rather than
adjusting colours.

**Cause.** His stylesheet puts `aspect-ratio:16/10` on `.return-preview`, left over from
the single-image version. At the new 1180px width that forces the frame to **738px**,
while the screen inside it is `16/9.2` = **679px**. The 59px difference exposed the
frame's own `#070605` beneath the screen's `#0B0A08` — two near-blacks meeting edge to
edge, which is exactly the hard horizontal line Ali saw. No amount of gradient work would
have touched it.

**Fix, two parts:**
- `aspect-ratio:auto !important` on the frame so it takes its height from its content.
  The `!important` is needed because he also sets `aspect-ratio:4/3.4` in a media query.
- The screen's background changed to `#070605`, identical to the frame. Belt and braces:
  even if some future rule reintroduces a height mismatch, there is no longer a value
  difference for a seam to show.

**Verified:** frame and screen heights now differ by **0px**, surfaces confirmed identical,
wordmark seated at the foot to within 1px and loading correctly. Plus the standing sweep —
0 sections moved, 0 overlaps, 0 collapsed, no horizontal overflow.

*(Note: during checking the wordmark appeared briefly absent in one capture. Measured it —
present, correctly placed, fully loaded. It was `loading="lazy"` decoding after a
programmatic jump, not a fault.)*

### 82. The frame now holds the real site
**Answering the background question first:** the page background was never changed. The
theme layer contains no `body`, `html` or `--ink` override — only font smoothing. The
single section-level background I altered is `.studio-return` itself, which is the
"different room" that was asked for. Nothing to revert.

**The preview is now a live iframe of `../index.html`** — the actual Manzar Studio, with
its real nav, its real hero film and its real wordmark. Not a likeness of it.

Why this rather than a screenshot: the browser tools hand me an image but expose no path I
can write into the project, so a captured PNG was never possible from my side. A live frame
is also strictly better than a screenshot would have been — it can never go stale, and it
is the same technique his own Work section already uses to show real products.

**How the weight is handled.** Studio's hero carries a large inlined film, so the frame's
`src` is left empty until the section comes within one screen of the viewport. Verified:
at the top of the page the iframe's `src` is still `null`. Visitors who never scroll this
far pay nothing for it.

**How it reads as a desktop site.** Rendered at a 1600 × 920 viewport and scaled by the
frame's measured width (0.7375 at 1180px), recomputed on resize. Without that it would
show Studio's mobile layout squeezed into a wide box.

**Safety.** `pointer-events:none` and `scrolling="no"` — confirmed in computed styles — so
it can never capture the page's scroll or take focus. The composed hero stays underneath as
the placeholder and remains the fallback on an `error` event.

**Background polish.** Added grain across the whole section at 5.5% overlay. A large
near-black field built from gradients bands into faint steps on 8-bit displays, and that
stepping is most of what reads as "low quality" on a dark surface. Noise breaks it up and
gives the surface texture rather than a flat digital wash — the same technique the plate
uses and the site already applies globally.

**Verified:** 0 sections moved, 0 overlaps, 0 collapsed, no horizontal overflow, iframe
`pointer-events:none`, and `src` confirmed unset until scrolled near.

### 83. The white flash — a real structural bug, not a timing one
**Cause.** `index.html` had **27 lines of orphaned menu markup sitting before
`<!DOCTYPE html>`.** Line 27 read `</div><!DOCTYPE html>`. Two consequences, both of which
the visitor saw:

1. The browser rendered that stray block as unstyled HTML — white background, blue
   underlined links — for the frame before the real document took over. That is exactly the
   "basic HTML page with hyperlinks" Ali described.
2. Content before the doctype puts the document into **quirks mode**.

It was a duplicate: the real menu already lives properly at line 747 inside the body. So it
also produced **two elements with `id="menu"`**, and `getElementById('menu')` returns the
first — meaning Studio's menu script had been binding to the orphan outside `<body>` all
along.

**Fix.** Removed the 1,570 stray characters. Verified: file begins with `<!DOCTYPE html>`,
`document.compatMode` is now `CSS1Compat` (standards mode, was quirks), one `id="menu"`,
tag counts balanced, body now starts with the skip link.

**Hardening, so this class of flash cannot return.** Added a first-paint guard to the head
of *both* pages, before any stylesheet:
- `html{background:#0B0A08}` inline, so the first frame the browser paints is ink. Even
  with no CSS loaded at all, the page can never be white.
- An inline script that reads the crossover flag during parse and raises the cover
  immediately, rather than waiting for `crossover.js` at the end of the body.
- `crossover.js` now drops that boot class the moment its own curtain exists, and again in
  `remove()`, so only one cover is ever in play and it cannot be stranded.

**Verified after a live crossover:** standards mode, doctype present, ink background, boot
shim released, **0 curtains left**, scroll unlocked.

### 84. The pointer, on both worlds
**Labs never had it.** The cursor CSS was in the theme layer but nothing added the `cur-on`
class that activates it — Labs had been running the system arrow while Studio had the
custom one. Added, skipped on coarse pointers.

**A path bug found while testing:** the theme referenced `../../assets/cursor-*.png`, which
from `labs/assets/css/` resolves to `labs/assets/` — where no cursor files exist. Corrected
to `../../../assets/`. Verified by loading both images from the page: **32×32, both resolve.**

**The clickable state is no longer an inversion.** It was the same dart flipped to a dark
fill, which read as a *different cursor* rather than a state of the same one. Both images
were regenerated from the approved dart shape:
- **Default** — white dart with a soft cast shadow, offset down-right. Depth, and it now
  reads on light backgrounds as well as dark.
- **Clickable** — the identical white dart *lifted further off the page*: a deeper, wider
  shadow plus a warm halo in the brand accent. Raised, not recoloured.

Studio embeds its cursors as inline base64 rather than file references, so both were
re-encoded into `index.html`; Labs points at the shared files. Same pointer across both
worlds. Coverage widened on Labs to match Studio: links, buttons, roles, accordion rows,
switch options, menu rows and children of links.

Originals kept at `assets/cursor-*.pre-depth.png`.

### 85. The clickable pointer, made unmistakable
The lifted-shadow version was too quiet — depth alone is not enough signal at 32 pixels.
The clickable state now changes on **three axes at once**: it is filled in the brand
vermilion, scaled 1.16, and carries a crisp 1px white rim plus a soft cast shadow. Same
silhouette throughout, so it is clearly a *state of this pointer* rather than a different
cursor.

Two craft notes: the rim is one pixel, not two — a thicker outline turns to mush at this
size, which the first attempt proved. And the dart is scaled about its own tip using an
affine transform rather than a resize-and-paste, so the point stays exactly where the
`2 2` hotspot expects it.

### 86. The pointer no longer drops out mid-crossover
`cur-on` was added by the main script at the end of the body. That meant for the whole of
every page load — and therefore for the whole of every crossover — the visitor got the
system arrow back, which is what Ali was seeing.

It is now set **during parse**, in the same head guard that raises the first-paint cover,
on both pages. The pointer is live from the first frame and never changes identity between
the worlds. The curtain itself was also given `cursor:inherit` so the full-screen overlay
cannot reset it while covering.

### 87. Hero weight
`.hero-title` 500 to **600**. 500 read elegant but thin at 268px; 600 gives the mark
presence without returning to the heavy condensed 700 it began at. Tracking tightened from
-.032em to -.038em and leading from .9 to .88 — heavier letterforms need slightly less air
between them to hold together as one word.

**Verified across both pages:** Labs — 0 sections moved, 0 overlaps, 0 collapsed, no
horizontal overflow. Studio — standards mode, ink background, `cur-on` set at parse, both
cursors resolving as data URIs and differing, 0 stranded curtains, boot shim released.
Both cursor images confirmed loading at 32×32 on Labs.

---

### 88. The pointer, actually fixed — and why entries 86 and 87 did not fix it

Entry 86 was wrong about the cause, so the fix could not work. Two things were dropping the
pointer, and neither was the timing of the `cur-on` class.

**Cause one — five pages never had a pointer at all.** `pricing.html` and the four
capability pages carried no cursor rule in any form. Changing pages from the menu therefore
landed on a page running the system arrow. That is the drop Ali kept seeing; the two pages
I was testing were the only two that had ever been given the rule.

**Cause two — `cursor:url(file.png)` is fetched lazily.** The browser does not request a
cursor image until the rule first applies, and it shows the `, auto` fallback while the
request is in flight. Labs pointed at `.png` files on disk, so every fresh navigation had a
window with the system arrow in it. Studio inlined its images and so did not.

Both are fixed by one file, `/assets/css/cursor.css`:

- Linked **first**, before every other stylesheet, in the `<head>` of all seven pages. A
  new page inherits the pointer by adding one line.
- Both images embedded as **base64 data URIs**, so they arrive with the stylesheet and
  there is nothing left to fetch.
- Gated on `@media (hover:hover) and (pointer:fine)` rather than a class. **No JavaScript
  is involved anywhere.** The class approach could vanish if the script was slow, threw, or
  the page came back from the back/forward cache; a media query cannot fail that way.

Removed as part of this: the cursor block in `manzar-theme.css` PART 8, the inline rules in
Studio's `<style>`, the head-guard line from entry 86, and both `classList.add('cur-on')`
calls in `labs/assets/js/main.js`. There are now zero references to `cur-on` in the project.

**A trap worth recording.** The first attempt inserted the `<link>` before the first
`<link rel="stylesheet">` in each document — which on five pages sits inside a `<noscript>`
block, so the tag was inert with JavaScript on. The insert now skips `<noscript>` ranges.
It looked correct in the file and did nothing in the browser.

### 89. The clickable pointer is monochrome

The vermilion fill is gone. Three candidates were rendered and compared on white, mid-grey
and ink before choosing:

- *stacked planes* — a dark copy offset behind the white dart. Good on light, nearly
  invisible on ink, where most of this site lives.
- *halo echo* — an expanded outline ring around the dart. Mush at 32px.
- *inverted plate* — **chosen.** The same dart, filled near-black, sitting on a 1.2px white
  keyline, scaled 6% about the hotspot, with a deeper cast shadow.

Inversion reads instantly on both light and dark, it is unmistakably the same dart rather
than a second cursor, and it is pure greyscale. The scale is applied as an affine transform
about (2,2) so the `2 2` hotspot does not drift between states.

### 90. Commitments: half the words, and a grid instead of a ledger

The six clauses ran a paragraph each. They now run to a line — 856 characters out of the
page, the section down from 450-odd words to 261.

Cutting the copy broke the layout, which is worth spelling out because it was invisible
until the text got short. The ledger was `56px | 1fr | 210px`: number, copy, the risk it
retires. On a wide screen that middle column is 2054px while the sentence stops at about
380px, so every row became a short line on the left, an enormous hole, and a label stranded
at the right edge — the eye had to cross the screen to connect two related things.

Six short items want a grid. Three across, two down, 1px gaps with the section background
showing through so it still reads as one ruled object. Same `<ol>`, same rows, same classes;
only the axis changed. Section height 1923px → 1447px, and it now fits one screen.

### 91. "Common asked" → "Frequently asked / Questions"

The FAQ pill read "Common asked", which is not a phrase, above a headline of "FAQ" — an
acronym sitting under its own expansion. Now "Frequently asked" over "Questions", which
reads as one line and drops the redundancy. The `id="faq"` is unchanged, so every link and
menu row still resolves.

### 92. The menu, rebuilt

**Content.** The four capability pages — AI, Cloud, Mobile, IoT — were gone from the Labs
menu, replaced by in-page anchors to sections the top nav already lists. Four real
destinations were unreachable from the only place that indexed them. All twelve original
rows are back, on all six pages that carry a menu, in three groups of four: Capabilities /
Studio / Company. The row for the page you are on is marked with a dot and is not styled as
somewhere to go.

**The dead band.** The groups held 6, 4 and 2 rows. `MZ.menu()` scales the rows to fill the
sheet off the tallest column, so two short columns left a large empty band. Groups of four
fixes the ragged part; the rest was the fitter itself, which could never settle against a
full-viewport sheet — at the size needed to fill 905px the long labels wrap, the column
overshoots, the guard shrinks it 4% at a time, and the moment a label un-wraps the height
falls off a cliff. It stopped at 1.83 with ~170px of dead sheet.

Left purely content-driven it settles at 1.0 instead, which is correct but mean: 594px of
small type on a 1215px screen. The sheet now has a floor at `min(74dvh, 900px)`. The fitter
gets about 670px to fill, lands at 1.85, and stops. Columns measure 670 against 677
available — 99% filled, no wrapping, no dead band.

**The broken thumbnail.** `manzar-system.css` gives the preview frame `flex:1 1 auto`, so it
stretched to the column height: a 245×505 portrait box. Every preview is landscape, and
`object-fit:cover` then discarded most of the width — which is why the wordmark came out
sliced through the middle of a letter. The frame now holds 16:10 and contains rather than
crops.

**The previews themselves.** `manzar-system.css` §3.9 carries an explicit policy: the
`conv-*`, `proc-*` and `work-*` photographs are tourist placeholders (see IMAGE-BRIEF.md)
and must not stand in for a destination, because that is a decorative mismatch. Honouring
it left three real images for twelve rows, eight of them the same screenshot, which is why
the panel looked dead. The Work and Process sections already solved this by moving to drawn
frames; `/assets/menu/` is the same move for the menu. Thirteen SVGs, one per destination
plus a default, all on one grid, two inks and one stroke weight, authored at exactly 16:10.
No photograph is asked to mean something it does not.

**Where it lives.** These overrides started in `manzar-theme.css`, which only the Labs page
loads — so the five other pages got the unfixed component, 0.42-ratio frame and all. They
are now `/assets/css/menu.css`, loaded after `manzar-system.css` on all six pages, and
written against their own custom properties rather than the theme layer's, which do not
exist outside Labs. Same lesson as the pointer: a shared component needs a shared file.

### 93. Capability pages

**Hero type.** The `h1` used `var(--shout)` — Tanker, which is caps-only — so a page heading
came out shouting in the face the house rules reserve for giant display lines ("General Sans
everywhere · Tanker only for the giant shout lines", index.html:40). Now General Sans 500 at
-.024em, matching Studio's and Labs' heroes, and reading in sentence case.

**Reveal safety net.** The reveal observer fires once per element and stops watching, which
is right, but it only fires while the tab is actually being rendered. A tab restored from
the back/forward cache, or opened in the background and scrolled before it is looked at, can
leave whole sections at opacity 0 permanently. Three cheap nets added to all five pages —
`pageshow`, `load`, and `visibilitychange` — each revealing anything already in the viewport.
Measured: 15 unrevealed, 8 in the viewport, net recovered exactly those 8.

*A note on how this was found, since it nearly caused a wrong fix.* The first measurement
showed all 16 reveals stuck and transitions frozen mid-flight at identical values. That
looked like a serious page bug. It was the test: the Chrome tab was backgrounded
(`document.visibilityState === "hidden"`), and Chrome pauses the rendering loop for hidden
tabs, so IntersectionObserver never fires and transitions freeze. The pages were fine. The
net is still worth having, because a real visitor can hit exactly that state.

**Verified, all seven pages:** standards mode, pointer resolving as a data URI on `body`,
a different image over links, no horizontal overflow, no broken images. All six menus:
12 rows, 3 groups, every href and every preview resolving on disk, 16:10 frame, correct
current-page row, correct world on the switcher. Clicking a menu row navigates and the
pointer holds across the navigation. Labs → Studio crossover: dark curtain, no white frame,
lands in standards mode, 0 stranded curtains, pointer held.

---

### 94. The menu, rewritten smaller

Ali's note was that it kept coming out big and messy. It did, and the reason was
structural rather than cosmetic: the sheet was pinned near the viewport height and
`MZ.menu()` scaled the type up until the rows filled it. That is a fitter fighting a
layout — at the size needed to fill 900px the long labels re-wrap, the column overshoots,
the guard shrinks it 4% at a time, and it settles somewhere arbitrary with 41px row
labels. Every previous attempt tuned the fitter. This removes it.

`.mzx-*`, a new self-contained component: `/assets/css/menu.css` + `/assets/js/menu.js`.

- **Full-screen overlay, fixed type scale.** Nothing measures anything, so nothing can
  oscillate. Row labels are `clamp(19px, 1.42vw, 27px)` and stay there.
- **Content and order exactly as specified** — Studio 01-05 (Work, Services, Showreel,
  Process, FAQ), Labs 06-09 (Cloud, Mobile, AI, IoT), Company 10-12 (Pricing, Studio,
  Contact), with the original descriptions.
- **Clean background.** One quiet radial off the top edge over flat ink. The noise layer
  and the saturating backdrop-filter are gone; they were what made it read murky.
- **Media panel** holds 16:10, the exact ratio the frames are drawn at, and crossfades
  between two stacked `<img>` layers so a swap never blinks. All frames are preloaded on
  first open.
- **Transitions** are a fade on the overlay and a 26ms-per-row stagger driven by `--i` in
  the markup, so no script touches the rows.
- **No dependency on manzar-system.** That is what lets Studio run the same menu — it does
  not load that file, which is why it was stuck with its own five-link panel. Studio's
  panel and toggle are retired; `menuSet` survives only as a shim because the anchor
  handler calls it.

`z-index:2500` — above the Labs nav (900) and its grain overlay (2000), below the
preloader (3000) and the crossover curtain (4000).

**Measured in Chrome at four real viewport widths**, each in its own iframe so the media
queries resolve honestly:

| viewport | head+body+foot | columns | frame | label | clipped | overlaps |
|---|---|---|---|---|---|---|
| 1920×1080 | 98+875+107 = 1080 | 3 | 422×265 (1.60) | 27px | none | none |
| 1600×1000 | 98+795+107 = 1000 | 3 | 386×242 (1.60) | 22.7px | none | none |
| 1280×860 | 91+665+103 = 859 | 3 | 309×194 (1.59) | 19px | none | none |
| 900×1000 | 73+840+87 = 1000 | 2, media hidden | — | 19px | none | none |

Exact fit at every width, nothing overflowing, nothing clipped. At 1280 the one long
label, "IoT & Connected Systems", wraps to two lines; it wraps cleanly and is left alone.

**A trap, again.** The first wiring pass reported every page already had the stylesheet
and script. It did not — the guard was matching the words `assets/css/menu.css` inside the
comment at the top of the markup block, so nothing was ever linked and the whole menu was
inert. Both the earlier `<noscript>` mistake and this one come from testing for a string
instead of a tag. The check now strips comments before it counts, and looks for
`<link …href=…>` rather than a filename.

### 95. FAQ

"Frequently asked / Questions" was the wrong way round. The big word is **FAQ**, with
"Before you ask" as the eyebrow above it — the same kicker that row already uses in the
menu.

### 96. Commitments, as diagram cards

Third version of this section, and the reason for the move is that the second one was
correct and dull. Six promises in six identical text cards made a promise about money, a
promise about cadence and a promise about ownership look like the same thing.

Each card is now led by a drawn diagram that animates when the card arrives:

| | promise | what the diagram does |
|---|---|---|
| 01 | price fixed at discovery | a shared ramp, then two futures: one keeps stepping up, one goes flat and a dot runs along it |
| 02 | a build every Friday | twelve slots on a baseline, one build landing in each, in order |
| 03 | accounts in your name | a bracket drawn around four account tiles, an ownership mark arriving on each |
| 04 | bad news early | a playhead crossing twelve weeks; the mark lands at week three, the late one is only a ghost |
| 05 | ninety days of support | build, a launch marker, then the bracket that keeps going past it |
| 06 | a decision, not an obligation | the trunk reaches a node and both ways out stay lit |

All six are hand-authored SVG on one system: 480×300, one bone ink at three alphas, 1.4px
strokes, no colour. Animation is CSS on inline SVG, held at
`animation-play-state:paused` until the card has `[data-reveal].is-in`, so nothing runs
off-screen; every draw-on uses `pathLength="1"` so the dash maths does not depend on path
length. `prefers-reduced-motion` holds each diagram at its finished state instead.

**Grid.** Two columns first, which was wrong: at 1920 a card is 937px wide, its diagram
937×586 — over half a viewport for a one-line promise — and the section ran 2838px, three
screens for six sentences. Three columns on wide screens, capped at 1780px, puts the
diagram back in proportion.

**Measured in Chrome:**

| viewport | columns | card | section height | diagrams | overlaps |
|---|---|---|---|---|---|
| 1920×1400 | 3 | 576×519 | 1606px (was 2838) | 6 at 1.60 | none |
| 1440×1400 | 3 | 461×438 | 1497px | 6 at 1.60 | none |
| 860×1600 | 1 | 845×669 | 4483px | 6 at 1.60 | none |

All cards equal height, no horizontal overflow, animations confirmed running once in view.

**On testing.** The Chrome tab I had been driving was closed mid-session and the browser
tool cannot open a `file://` URL in a fresh tab, so the live page could not be driven this
round. Chromium could not be installed in the sandbox either — no root, and the download
is off the allowlist. The numbers above were taken by rendering the real markup and the
real stylesheets inside sized iframes and having them measure themselves, which gives true
Chrome layout at a chosen viewport. It does not replace looking at the page, so the two
preview files are worth opening.

---

### 97. Menu, second pass — presence

The first version of the new menu was legible but small: 19px rows and 10px numerals
adrift in a 1440px overlay, which is why it read as a template rather than as part of this
site. Everything is roughly a third larger and the three footer objects are designed
rather than defaulted.

Measured in Chrome at 2560×1440, which is the screen it is actually being looked at on:

| | before | after |
|---|---|---|
| row label | 19px | **46px** |
| row numeral | 10.5px | **24px** |
| group label (Studio / Labs / Company) | 10.5px mono, 38% | **18px General Sans 600, 58%** |
| description | 13.5px | 16px |
| close button | a 14px text link | **a 125×52 pill** |
| world switch | 34px tall | 50px, one object with a filled on-state |
| clocks | `LHE 14:03:00` mono | **Lahore / 14:19** stacked, tabular figures, no seconds |
| media frame | 422×265 | 522×327 |
| dead space above the rows | 275px | 213px |

Numerals use `font-variant-numeric: tabular-nums` so 01 and 11 occupy the same width and
every label in a column starts on the same vertical. Row padding is
`clamp(15px, min(1.2vw, 2.4vh), 32px)` — keyed to viewport *height* as well as width,
because a tall screen is exactly where the block looked lost.

**The seconds were a bug, not a style choice.** `data-clock` is also manzar-system.js's
hook and it writes `HH:MM:SS`, so both scripts were writing to the same nodes. The menu's
clocks are `data-mzx-clock` now, which nothing else claims.

Verified at four widths — head+body+foot sums to exactly the viewport at 2560×1440,
1920×1080, 1440×900 and 1000×900, nothing clipped, nothing wrapped, no group overlaps,
frame ratio 1.60 throughout. The 1000×900 case overflowed on the first attempt (733px of
rows in a 711px body); the two-column breakpoint now uses tighter row padding.

### 98. Menu diagrams — six redrawn, all thirteen re-centred

Ali named six as looking terrible. They were: the marks were generic, and separately
**every frame was off-centre**, which is what made them look unresolved. Two causes.

The wrapper scaled about `(400,250)` — not the centre of the plate — and the motifs were
drafted against a 480×300 grid while the plate is actually **800×500**, so every drawing
sat in the upper-left quadrant. Both are fixed, and the generator now *measures* each
motif's ink and computes a translate and scale from it, so centring is not a matter of
eye. All thirteen frames measure within 0.2px of centre and fill a consistent share of
the plate.

Redrawn, each so the mark means the destination rather than decorating it:

| | was | now |
|---|---|---|
| AI Development | a random constellation | three of your records converging on one node, one answer leaving it |
| Studio | an aperture that read as a gear | a film frame and a software window overlapping — the two halves |
| Pricing | a bar chart, which said "metrics" | three engagements at three lengths on one scale |
| Work | a contact-sheet grid | project frames stacked back to front, the selected one lifted |
| Process | three dots on a line, too thin to read | three phases with real extent, the middle one running |
| FAQ | rules with plus signs, read as a settings list | an accordion with one row open and its answer beneath |

### 99. Commitment cards — padding and centring

Card padding was `clamp(18px,1.5vw,24px)`, which put the promise almost against the
border. Now `clamp(24px,2vw,36px)` — 36px of inset at 1920 and above, measured.

The six diagrams had the same centring problem as the menu frames and are now put through
the same measured fit: all six sit within 2px of centre. `grid-auto-rows:1fr` keeps every
card the same height, so a promise that wraps to two lines no longer leaves its row taller
than the one below.

**Still not verified by eye.** The browser tool cannot open a `file://` URL in a fresh tab
and the tab from earlier in the session is gone, so everything above was measured by
rendering the real markup and stylesheets inside sized iframes and having them report
their own geometry. That is true Chrome layout, but it is not the same as looking at the
page. Ali has offered to open a tab; that is the right next step.

---

### 100. The proof section — six live builds on the machine

Six sites Ali built go on the laptop, replacing five reels of which three were
placeholders (`Ardenta`, `This one's yours`, and a link back to Studio) and two were real
client work (`Smart HR`, `Amantech`). Each reel's `data-src` and `data-href` are now the
same live URL, so the screen loads the real site and "Open site" hands you the same page
in its own tab.

Ordered best design first, judged by reading each one:

| | site | why there | tint |
|---|---|---|---|
| 01 | NORTHLIGHT | WebGL and GSAP, plus a settings panel that re-themes the entire site — atmosphere, palette, cursor, typography, shader detail | `#38bdf8` |
| 02 | Belleville Works | six full product interfaces drawn from scratch (HR, voice survey with live transcript, patient monitoring with ECG, fleet map, booking, design tokens) inside a film-reel conceit | `#ff4d2e` |
| 03 | VΞLOX | placed here on Ali's call | `#8b5cf6` |
| 04 | Broadside | a letterpress conceit held all the way down to the colophon, with its own ink/paper configurator | `#d9b382` |
| 05 | Halloran Instrument Co. | spec tables, emissivity, calibration tolerances, live thermal readout | `#ff8a1f` |
| 06 | Hollis & Page | clean and well made, but the most conventional of the six | `#8ea3b8` |

Each tint lights the room glow, the desk spill and the bezel, so moving between reels
changes the colour of the light in the section.

**The copy was claiming things that are not true of these six.** The lede read "Eight
products, running on the machine below" over a section headed "The proof", with slate
lines like "Payroll for 11,000 people, closed in a day." These are builds with fictional
clients, not products in production, and there were five reels rather than eight. The lede
is now "Six sites, designed and built end to end", and every slate line describes what the
site *is* rather than inventing a metric for it.

### 101. The black box behind the laptop

The plate is a photograph of a laptop shot on a seamless black field — 0,0,0 — and the
page is ink, `#0B0A08`. Eleven levels apart and slightly cooler, which is exactly enough
to read as a black rectangle sitting on the page instead of a machine standing in it.

It had been treated with an edge feather in CSS: `mask-image` fading the outer 6–7% of the
image. That softens the symptom at the border and leaves the middle wrong, which is what
Ali was seeing.

The surround is knocked out of the file instead. The black is flood-filled inward from all
four borders of the image, anything the flood cannot reach is enclosed by the machine — the
screen well, the gaps under the hinge — and stays opaque, and the result is written to
alpha with one soft pixel at the boundary. 59.6% of the plate is now transparent and the
machine has no background at all, so the page shows through whatever colour it happens to
be. Verified by compositing over `#0B0A08` and over a mid grey: no rectangle, no dark
fringe on the chassis edge. The CSS feather is gone; the tinted room light behind the
machine is still `.mach-glow`.

### 102. Clicking into the screen

Resting the cursor on the glass already handed scrolling to the page inside, after a short
dwell that stops people who are merely scrolling past. Nothing announced it.

- **A click anywhere on the machine now engages immediately** — no dwell to discover.
- **A hint sits on the glass** while a site is loaded but not yet engaged: "Hover or click
  to use it · esc to exit". It ignores the pointer and clears the moment you take control,
  or if the frame refuses to load.
- **On touch there is still no engaging.** An embedded page you can pan has no Esc and no
  way back out, so a tap opens the real site in its own tab instead.
- The machine shows a pointer cursor while it is loaded and not yet live.

**A trap worth recording.** The hint's CSS was inserted before `.mach-poster{`, which
occurs three times in `style.css` — once at the top level and twice inside media queries —
so `str.replace` wrote the whole block three times. Caught by grepping for the selector
after the edit rather than trusting the write. Brace count confirms the two extra copies
were removed cleanly and a selector-level diff against the backup shows only additions.

**Not verified.** Whether all six allow themselves to be framed. `X-Frame-Options` and
`frame-ancestors` are response headers that the fetch tool does not surface, and there is
no browser available to test. Vercel and Next.js do not set either by default, so this
should be fine — and if one does refuse, the machine already handles it: a six-second
timer flips the reel to `is-cold` and shows "This one will not run inside a frame. Open it
in a tab ↗". Any site that turns out to refuse should get `data-embed="false"` on its reel
so it skips the wait and shows the poster immediately.

---

### 103. Responsive: unfreezing the scale between 1080p and 2K

The site looked right at 2560 and wrong at 1920, and the reason was structural rather
than a matter of taste.

**The highest breakpoint anywhere in the project was 1400px.** Between 1400 and 2560 there
was no responsive adaptation at all — every size came from `clamp()` arithmetic that had
been eyeballed on a 2560 screen.

That would have been fine if the clamps scaled. They didn't. **70 display-type rules
reached their ceiling at 1920 *and* at 2560**, so the type was the same number of pixels
on both while the screen was 25% narrower. `.conv-word` is the clearest case:

```
clamp(44px, 9.8vw, 172px)
   2560 → 9.8vw = 251px → clamps to 172
   1920 → 9.8vw = 188px → clamps to 172     ← same size, smaller screen
```

Relative to the viewport that is a third larger at 1080p. Everything read cramped, and with
`white-space:nowrap` the convergence words ran straight off the edge.

**The fix is one number per rule: set the vw term to `ceiling ÷ 25.6`.** At 2560 the clamp
still lands exactly on its ceiling, so that screen renders identically; every width below
scales in proportion. No media query, no discontinuity.

97 declarations retuned across `index.html`, `pricing.html`, `manzar-system.css`,
`style.css` and `manzar-theme.css` — font sizes and the larger spacing tokens. Rules inside
media queries were deliberately skipped: an `11.5vw` in a phone block is tuned for a phone,
and retuning it would have shrunk the mobile layout.

Verified by rendering both pages at four real viewports and re-measuring:

| | 2560 | 1920 | 1440 | 390 |
|---|---|---|---|---|
| Studio h1 | 46 → **46** | 46 → **35** | 40 → **26** | 18 |
| Studio h2 | 62 → **62** | 62 → **47** | 56 → **35** | 30 |
| Labs h1 | 268 → **268** | 268 → **201** | 238 → **151** | 76 |

2560 is untouched — every clamp lands on the same value, and Studio's total page height
moved by 1px across the whole retune. 1920 is now exactly 0.75× of 2560, which is what
"looks like the 2K version" means arithmetically.

### 104. Responsive: the overflow bugs

**Mobile was scrolling sideways on both pages, which is what "zoomed in" was.** A page
wider than the viewport lets the browser pan, and everything reads oversized and shifted.

- **Studio, 560px of content on a 390px screen.** `.srow .s-use` — the use-case line beside
  each service — is `position:absolute; left:calc(100% + …); white-space:nowrap`, parked
  outside its heading. Fine at desktop, 170px past the edge on a phone. It is now static,
  block and wrapping below the title on small screens.
- **Studio FAQ, 452px wide.** `.faq-rail` becomes a flex row under 1024px: a 130px portrait
  plus a `max-width:22ch` line does not fit a phone. It wraps now.
- **Labs, the nav ran to x=823 on a 390px screen.** The mobile nav rules in the project all
  target `.mz-nav-*`, the shared system nav — but this page uses its own `.nav-links` /
  `.nav-right`. So there were no mobile rules for it at all and it stayed at desktop size.
  The links now hide under 900px (the menu is the navigation on a phone), the CTA goes
  icon-only, and under 520px the world switch drops too since it also lives in the menu.
- **1080p and 1440 overflow fixed by the retune itself** — the oversized nowrap headline was
  the cause, so correcting the scale corrected the overflow.

A guard was added at the end: `html,body{overflow-x:hidden}` under 900px. Every overflow
found was fixed at source; the guard is there so one long unbreakable string can never cost
the whole page a horizontal scrollbar again.

Final sweep, reporting every overflowing element rather than the first few:
**Studio — zero at 2560, 1920, 1440 and 390.** Labs — zero at 2560, 1920 and 390.

### 105. A structural bug caught on the way

`labs/index.html` was missing one `</div>`. Walking the tag tree showed every section at
depth 2 up to `#work`, then depth 3 from `#studio` onward — **every section after the proof
section was nested inside `.mach`**, the laptop's 3D-transformed container. My proof-section
rebuild (entry 100) had consumed the `</div>` that closed it.

It was balanced before that edit and mismatched after, so it was mine. The earlier check
missed it because `count('<div')` and `count('</div>')` happened to agree; a real tag walk
does not. Restored, and section depths are uniform again.

**Not verified.** Labs still reports ~30px of overflow at 1440 from `.ticker-track` and
`.mach-hint`. `.ticker` has `overflow:hidden`, so it cannot cause document overflow, and
`.mach-hint` sits inside `.mach-screen`, which GSAP positions with a matrix3d that cannot
run under the artifact's CSP. Both are almost certainly probe artefacts, but 1440 should be
looked at in a real browser before that is called closed.

---

### 106. Real brand marks, and why hand-tracing was the wrong call

I had proposed setting AWS/Azure/GCP as wordmarks in our own type rather than using the
logos. Ali pushed back — it is nominative use, not appropriation — and he was right. The
better-looking option is the real marks, and they were one `npm install` away.

**Source: `devicon`.** It ships the official paths for all three providers plus the tooling.
Worth recording that `simple-icons` does *not* carry AWS, Azure or OpenAI — those brands
asked to be removed from it — so anything built on that package alone would have been
missing exactly the three logos this needed.

Twenty marks extracted to `assets/brands/`, 44 KB total. Every gradient `id` is namespaced
on the way in (`azure-a` rather than `a`), because several of these ship with ids like `a`
and two on one page would otherwise fight over the same gradient.

### 107. The four capability frames, rebuilt around what we run on

The drawn geometric marks said "some kind of system" and no more. A visitor opening the
menu should know what Cloud & Infrastructure means before reading a word.

| frame | now shows |
|---|---|
| Cloud | AWS, Azure and GCP across the top → Kubernetes as the layer they share → Terraform, Docker, Postgres beneath |
| AI | PyTorch, TensorFlow, Python → your records feeding a grounded model → one cited answer leaving it |
| Mobile | a device in the centre, React, Swift, Flutter and Kotlin around it, all resolving to one Node API |
| IoT | Raspberry Pi and Arduino in the field → an MQTT gateway → Grafana dashboards and alerts |

Label sizes were raised after the first render: these are read at roughly 520px wide in the
menu panel, so an 11px label on an 800px canvas lands near 7px and turns to texture. They
are 13–15px now and survive the downscale.

### 108. Services — the section the page was missing

Labs never said plainly that it does IoT, cloud, AI, web and mobile. It said "five
disciplines" and left the visitor to infer, which is a lot to ask of someone deciding
whether to email you.

Five cards, leading with the marks rather than the words, because a visitor recognises AWS
or PyTorch in a glance and has placed us before reading a line. That lets the copy be short
and lets it talk to the person signing rather than only the person integrating — the brief
Ali set: serious engineering, in language a non-technical stakeholder can carry into a
meeting.

The standfirst is his line, near enough verbatim: *"We build and operate AI-native software
products for companies that need serious engineering — from the model down to the metal it
runs on."*

Layout is an editorial 3-column grid with the AI card spanning two, so the five read as 2+3
rather than a uniform rank of boxes. Logos rest slightly desaturated and come to full colour
on hover, so the section is the only colour on the page without being a colour riot.

The two bullets under the six-weeks block (`.vel-why` — "A foundation, not an empty repo",
"Decisions in hours") are gone, as asked.

**Measured at four widths:** 3 / 3 / 2 / 1 columns, five cards, no overlap at any width, all
18 brand images resolving, no horizontal overflow, section 1804px at 2560 and 3218px on a
phone.

### 109. Browser access — a real blocker

Ali asked me to stop handing QA back to him. I can't fully, yet, and it is worth being
precise about why rather than vague.

The Chrome extension's `navigate` prepends `https://` to any URL it is given, so
`file:///C:/…` becomes `https://file:///C:/…` and lands on an error page. Three attempts,
identical result. From that error page Chrome blocks scripted navigation back to `file://`,
`tabs_create_mcp` only yields `chrome://newtab` which cannot be scripted, and the
computer-use tool operates inside the page rather than the address bar. The sandbox is
firewalled from the outside, so serving the folder over HTTP does not help either.

One `file://` tab opened by hand is enough — from there `location.href` is same-origin and I
can drive the entire site unaided. Until then, layout verification runs through sized
iframes in an artifact, which gives true Chrome geometry but cannot execute GSAP or CDN
scripts.

---

### 110. The menu trigger was broken by a rule I left behind

Ali's screenshot showed "Menu" with a bar struck through it. Inspecting the live element
rather than guessing gave the answer immediately:

```
label span → display:block  width:20px  height:1.5px  background:#fff
```

The label was being painted as a **20×1.5px white bar** with the word spilling out of it.

The cause was mine. When I rebuilt the trigger I replaced Studio's rules but only *appended*
new ones on Labs, leaving PART 9's `.menu-btn span { width:20px; height:1.5px; background:
currentColor }` in place. That selector is (0,1,1); my `.menu-btn-label` is (0,1,0). The old
rule outranked the new one and turned both of my spans into little bars.

Deleted rather than overridden — including the `.is-open` cross, which drove the retired
MZ.menu() and nothing now. Adding a counter-override would have left two sets of rules
fighting over one element, which is how this happened in the first place.

**Verified live in Chrome**, both pages: button 111×46, label 41×16 with a transparent
background at 16px, chip 32×32, bars 15×2 and 9×2, nav 90px with three non-overlapping
zones and no horizontal overflow. The trigger now reads as the sibling of "Start a project"
and the menu's Close pill, which is what it should have been.

### 111. Live QA is unblocked

Ali opened a `file://` tab. From there `location.href` is same-origin, so I can reach every
page unaided — no more handing verification back to him.

First pass with it confirmed, on the real pages rather than in a harness: the menu opens and
closes, the twelve rows render at the new scale, the clocks read `02:14 / 23:14` with no
seconds, hovering *Cloud & Infrastructure* swaps in the new frame with AWS, Azure and GCP
crisp and in colour, and the services section renders with its brand pills at full colour.

---

### 112. The car is gone

`labs/assets/img/mission.jpg` was a sports car under light trails, sitting beside the line
"Software that earns the second look, live before your window closes." It was presumably
chosen for the feeling of speed, but a software company showing a car has to explain
itself, and IMAGE-BRIEF.md already lists these photographs as placeholders.

The headline argues two things at once — speed *and* durability — so the replacement draws
exactly that: light trails that start loose and wandering on the left and settle onto an
ordered lattice on the right. Motion becoming structure. Generated rather than
photographed, so it belongs to the same family as the menu frames and the machine plate,
and it cannot be a stock image of something we do not do.

Built procedurally: 22 trails with per-trail wander that decays as they travel right, four
hot cores landing exactly on lattice rows, three-stage bloom per trail, a low horizon glow,
vignette, gamma lift and grain. One warm trail among the cool ones, which is the only
colour in the frame.

Two passes were needed. The first was far too dark — the vignette was crushing a set of
already-dim trails, and it read as a faint oscilloscope trace. Exposure, trail count and
bloom all went up substantially. Then downsampled 2400→1600px: the slot is 626px, so 1600
covers retina and the file went 451 KB → **147 KB**.

### 113. A false alarm worth writing down

After swapping the image the browser reported it unloaded — `complete:false`,
`naturalWidth:0` — and the figure rendered as an empty box. The file was a valid JPEG and
PIL opened it fine, so the obvious conclusion was a broken write or a bad path.

It was neither. Requesting the exact same URL by hand returned `OK 1600x893` immediately.
The element was `loading="lazy"`, and **`document.visibilityState` was `"hidden"`** — the
tab is backgrounded while Ali is looking at Claude rather than at Chrome, and Chrome defers
lazy images and pauses IntersectionObserver in hidden tabs. Only 11 of 81 reveals had
fired for the same reason.

This is the third time this session that a backgrounded tab has looked like a site bug.
The tell is always the same: forcing the thing by hand works instantly. Any QA pass from
here should set `loading="eager"` and add `.is-in` before judging what is on screen —
screenshots still paint, because CDP forces a frame, but nothing lazy will have run.

---

### 114. Menu head and foot

**Head.** 120px tall, holding a 36px "MENU" label on the left and the Close button on the
right, with about 2,200px of nothing between them on a 2560 screen. Opening the menu meant
losing every cue about where you were. It now carries the Manzar wordmark and the world you
are currently in — *Labs* or *Studio*, set per page — separated by a hairline. The one thing
a menu should never make you guess is which site you are on.

**Foot.** Four items under `justify-content:space-between`, which scattered them at 92, 857,
1581 and 2281 — the mail and the clocks floating in open space with nothing to align to. It
is a five-track grid now (`auto auto 1fr auto auto`): switch and mail grouped left, clocks
and CTA grouped right, one flexible gap carrying the slack. Measured after: 92–277, 315–459,
then 2084–2205, 2243–2430. Same four items, on a rhythm.

### 115. The nav was showing through the open menu

With the new head in place the page nav was visible on top of the open menu — two wordmarks
and two "Menu" affordances inside the same 120px.

The odd part is that it should not have been possible. `elementFromPoint` returned menu
elements at every sampled coordinate, the panel measured 2560×1215 at `opacity:1` with an
opaque `rgb(11,10,8)` background, and its `z-index` is 2500 against the nav's 190. By paint
order and hit-testing the menu was unambiguously on top.

The cause is `mix-blend-mode:difference` on `.nav`. A blended element composites against its
backdrop rather than simply stacking, and pairing that with a full-screen overlay is exactly
the combination that renders inconsistently across compositing paths.

Rather than fight it, the nav is hidden while the menu is open —
`html.mzx-lock .nav { opacity:0; pointer-events:none }`, and `.mzx-lock` is already set on
`<html>` by the menu. That removes the blend hazard entirely and is the better design
regardless: the menu now has its own wordmark, so the nav underneath was redundant.

Verified with the transition end-state forced: head shows wordmark + LABS, twelve rows in
three groups, media panel present, foot on its new rhythm, and no trace of the page nav.

---

### 116. The other nine frames, brought up to weight

Giving four frames real logos created a new problem: the remaining nine were still thin line
drawings, and the menu shows them one after another as the cursor moves down the rows. Two
different, visibly unequal sets.

No logo applies to "Process" or "FAQ", so parity had to come from structure instead — the
same plate, the same card language, and a label on every element so each frame *states* what
it is rather than implying it:

| frame | now says |
|---|---|
| Work | three project frames stacked, with 40+ / 100% / 9 underneath |
| Services | the five disciplines named in a list, AI selected |
| Showreel | a film run, a play mark, and `00:00:30:00` |
| Process | DISCOVER · BUILD · SHIP as cards, with a progress rail at week 3 of 6 |
| Pricing | SPRINT / BUILD / RETAINER as three rails of increasing length |
| Studio | a FILM panel and a SOFTWARE panel, overlapping |
| FAQ | an accordion with one row open and its answer beneath |
| Contact | the address, a reply leaving the frame, "replies within 24 hours" |
| World | the globe with LHE and PAR marked and a line between them |

Two defects caught and fixed on the way, both by rendering rather than reading:

**Unescaped ampersands.** "AI & APPLIED ML" and friends produced invalid XML, and the whole
frame failed to parse. All emitted text is escaped now, and every one of the thirteen frames
is checked with an XML parser after generation rather than assumed good.

**A clipped arrowhead.** The Retainer rail was drawn from x=330 for 500px — 830 on an
800-wide canvas — so its end mark fell off the edge. Only visible once the frame was on
screen at size. Rails are 140/300/420 now, max x 750, and I check the extents after
generating.

Verified live: hovering *Pricing* in the open menu swaps in the new frame, correctly
composed and fully inside its plate.

---

### 117. The timeline was being told twice

The page carried two timelines. `#speed` — "Six weeks to live" — walked the weeks from our
side. And inside `svc-01`, a five-stop rail walked *the same six weeks* from the client's;
its own subhead said so outright: "The same six weeks from your side of the table."

Two sections, one story, told back to back with different numbers on the stops.

The client-side rail is the better of the two, so it is the one that survives. Every stop
carries three things the other never did — what the stage costs in time, what you decide,
and what you hold at the end of it: Validate (week 0, free) → Scope (week 1) → Design &
build (weeks 2–6) → Launch (week 6) → On call (90 days). The urgency line from the deleted
section was folded into its standfirst so nothing good was lost: *"Every week you are not
live, the market belongs to someone else."*

It keeps `id="speed"`, so the nav link, the footer link and the Studio page all still land
on it without touching a single href.

**A knock-on the removal exposed.** With `#speed` gone from its old slot, the new Services
grid floated up to sit immediately before `services-intro` — a 19-word banner reading
"Capabilities / What we build / five disciplines, one team". Two "what we do" headers in a
row, and the banner now redundant, because the Services grid *names* the five disciplines
instead of counting them. The banner is deleted and its `#services` anchor moved to the
section that does its job.

Final order: hero → mission → **timeline** → **services** → the four capability sections →
work → studio → commitments → faq → contact → studio-return. The timeline is back where it
belongs in the argument: what we do, then how it goes, then the detail.

`velocityTrack()` guards on both `#speed` and `.vel-track`, so it no-ops cleanly now that
the track is gone rather than throwing.

**Verified live:** every in-page link resolves, divs and sections balanced, no horizontal
overflow, five stops with no overlap, and the scrub confirmed by driving it through its own
range — progress 0→1, `--fill` 0→5.000, all five stops lit. That last check had to be
forced: GSAP's ticker does not advance on scroll in a hidden tab, which made a working rail
look frozen at 0. Fourth time this session.

---

### 118. Copy: the positioning slots

Two problems here, and length was the less important one.

The subtler problem was that the two sentences most visitors actually read — the hero blurb
and the mission line — described a **category** rather than making a claim:

> AI products, enterprise platforms and connected systems. MVPs live in six weeks.

That is a list of nouns. Every agency site says a version of it. It does not tell a buyer we
are the serious option, and it gives their engineer nothing to react to. Both slots now make
a claim, in the register Ali set:

> **We build and operate AI-native software products for companies that need serious
> engineering. Live in six weeks, not six quarters.**

"Operate" is doing real work in that sentence — it is the word that separates a firm which
hands over a repo from one that runs the thing in production, and it is defensible, because
the commitments section already promises ninety days on call. "Live in six weeks, not six
quarters" keeps the speed claim but gives it something to push against.

The mission line follows it: *"Senior engineers who build the thing and then run it in
production — not a ticket queue."* Same claim, said to the person who will forward the link
to their CTO.

Three long passages were also cut — the AI paragraph from 37 words to 27, the enterprise
subhead sharpened from a category to what it replaces, and the interface subhead
de-throat-cleared.

**A bug I wrote and caught.** The mission replacement mixed a triple-quoted Python string
with implicit concatenation, so Python folded a stray `"` and a newline into the middle of
the sentence — it shipped to the file as `...who build the "\n "thing and then...`. Reading
the value back out of the DOM rather than trusting the edit is what surfaced it. Repaired,
and the file is checked for stray quote/newline artefacts now.

Section weights after: mission 59, timeline 237, services 266, AI 195, enterprise 156,
interface 111, design systems 63. The two heaviest are the two that carry the argument —
the timeline's five stops and the services grid's five cards — and both are structured as
scannable units rather than prose, which is the point.

---

### 119. The mission visual, third attempt

The car said nothing about software. The light trails that replaced it said "motion" but
read as an oscilloscope trace — abstract where the section needs to be concrete. It sits
beside "Software that earns the second look" and four production stats, so it should show
the thing itself.

Three interface planes in perspective: a monitoring surface behind, the records it reads in
the middle, and a live p95 response card in front, the only accent on the frame. Drawn as
**SVG**, not a raster — 7 KB against the JPEG's 147 KB, and sharp at any size, which matters
because it renders at 689px in a 1600px-wide file.

The first render had the fault this project has hit before: the glow terminated inside the
frame, so its ellipse edge was visible as a hard oval. Anchored off-frame with an extra
mid-stop, exactly as the crossover plate was fixed earlier.

### 120. Services, as a carousel

Five cards at once was "too much to swallow" — five things competing for one glance and none
of them read. Norvin shows one and lets the neighbours peek, so the eye has a single place
to be and the rest reads as depth. Same content, different pacing.

- One card centred at full strength; neighbours at `.32` opacity and `scale(.93)`.
- **The stack leads the card.** Logos are 30px with the name beside them, at full colour on
  the active card and desaturated either side, so colour tracks attention. That is what tells
  an engineer we are serious before they read a line, and it is why the copy underneath can
  be short.
- Arrows, a dot rail, a live `01 / 05` counter, keyboard arrows and swipe.

**The timer surrenders permanently the first time you take control** — any arrow, dot, key or
swipe. An auto-rotator that keeps stealing the card back from someone who is reading it is
worse than no rotation. It also stops while the pointer rests on the stage, while the section
is off screen, and while the tab is hidden, where a naked `setInterval` would otherwise queue
up skipped ticks and lurch on return.

Movement is a single CSS transform on the track driven by a `--i` custom property; JS only
sets that number and toggles a class, so nothing animates off the compositor.

Cards that are not showing get `aria-hidden` and every link inside them drops to
`tabIndex -1`, so keyboard focus cannot wander into a card nobody can see.

**Verified live:** 5 cards, exactly one active, active card centred to within 40px of the
viewport centre, 21 brand images all resolving, no horizontal overflow. Controls exercised in
order — next wrapped 4→0, dot jumped to 3, prev to 2, ArrowRight to 3, counter tracking
throughout, off-screen cards confirmed non-tabbable. The rotator had already advanced on its
own before the first click, which is how the run started at 4.

**One defect the sweep caught:** the menu's second crossfade layer shipped as `<img src="">`.
An empty `src` resolves against the document URL, so every page was quietly fetching itself
as an image. The attribute is omitted now on all seven pages; `menu.js` sets a real one on
the first swap.

---

### 121. The mission image, settled

Three generated attempts and all three were wrong for the same reason: a section headed
"Software that earns the second look", sitting beside four production stats, wanted a
photograph of the work — not an abstraction of it.

It now uses **`labs/assets/img/acc-product.jpg`**, which was already in the project: an
engineer at a multi-monitor desk, dark, real, and unmistakably the thing the section is
describing. The generated SVG is deleted.

Worth recording for next time: when a slot needs a photograph, the answer is a photograph.
Surveying what was already in the folders took one command and produced a better result
than three rounds of generation.

### 122. The carousel, made infinite

Three faults, all fair.

**It rewound instead of looping.** The first build stepped with a modulo, so the last card
back to the first slid the whole track backwards across five card widths. That is a rewind.
There is now a clone set either side of the real five, so a step always continues in the
direction asked for; when it lands on a clone the track is silently rebased onto the
matching real card with the transition off for one frame. Verified: forward gives
`1,2,3,4,0,1,2,3` and backward gives `2,1,0,4,3,2` — it circles both ways.

**The counter had to go.** `01 / 05` under the cards made it read as a slideshow. Dots
only, as on the reference.

**And a freeze I introduced and caught.** I gated the next step on `transitionend`. That
event does not fire in a background tab, under reduced-motion, or when a transition is
interrupted — so one missed event left `animating` stuck true and the carousel dead for
good. It showed up immediately in testing: the dot sequence went `0,1,1,1,1,1,1`. A timer
owns the settle now and `transitionend` is only an early exit. This would have bitten a
real visitor who switched tabs mid-slide.

Verified live: 15 cards (5 real, 10 clones), one active, dots tracking the live index,
arrows and dots and keyboard and swipe all stepping, no horizontal overflow.

---

## 123 · Services carousel — the pass that actually landed

**What was wrong with 122.** Two faults, both visible in the screenshot and
neither in the numbers: the leading clone set had been inserted in reverse, so
two copies of the same card sat next to each other at the seam, and seven cards
were on screen against five unique ones.

**Clone order.** `insertBefore` inside a forward loop reverses the set — each
new node lands in front of the last. Both sets are now built in a
`DocumentFragment` and inserted once, so order is preserved.

**Card width.** `--card` `clamp(290px, 33vw, 580px)` → `clamp(276px, 29vw, 500px)`,
gap `1.2vw` → `1.1vw`. 465 × 330 at 1920, 312 × 358 at 390. Smaller, as asked,
and roughly four in view against five unique.

**The stack, trimmed to three marks a card.** Cloud carried six and IoT three,
so the chip row was one line on some cards and two on others, and the title
moved down the card as the carousel turned. Three each now, plus a 36px floor
on the row: the title sits at exactly the same height on all five (measured —
124px from the top of every card).

**Controls out of the way.** The arrows were absolutely positioned over the
cards either side, which meant two pieces of chrome permanently covering
content. They now sit in the rail with the dots — one row under the card,
smaller (38px), nothing on top of anything.

**Edge fade.** The cards either side ran off the screen and were cut by a hard
vertical line. A `mask-image` gradient fades the last 10% at each end, so the
rail reads as continuing rather than stopping.

**Autoplay, reworked.** `start()` was being called from three handlers that each
knew only their own half of the picture — hover, tab visibility, and the
IntersectionObserver — and any one of them could contradict another. Now there
are three flags (`inView`, `byPointer`, `document.hidden`) and one `sync()` that
reads all of them. Added a 1.6s rect fallback for the case where IO has not
reported by the time the page settles.

Verified live: rotates on 4.6s (AI → Cloud → Web), drag takes hold and snaps one
card on release, dots track, hand-driven interaction stops the rotation for good.

**Horizontal overflow at 1366 and 1440.** Found while measuring, unrelated to
the carousel. `.svc-head::before` — the glow behind each section head — is
`min(130%, 1500px)` wide and centred, so it spilled 67px past the right edge at
1366 and 33px at 1440, giving the whole page a horizontal scrollbar. `.svc` now
carries `overflow-x: clip`, which cuts it without making the section a scroll
container the way `hidden` would. 1366 / 1440 / 1920 / 390 all measure
`scrollWidth === innerWidth` on both Labs and Studio.

### Revert
- `--card` and `--gap`: `labs/assets/css/manzar-theme.css`, PART 14, `.lsv-track`
- arrows: markup moved from `.lsv-stage` into `.lsv-rail` in `labs/index.html`
- mask: `.lsv-viewport`
- overflow fix: the single `.svc{ overflow-x:clip; }` rule above `.svc-head::before`
- autoplay: the `sync()` block in `labs/assets/js/main.js`

---

## 124 · Services cards — overhauled, not adjusted

**I went and measured the reference instead of guessing again.** Opened
norvin.framer.website and read the computed styles off its service card:

```
card      429 × 219   radius 20   padding 40   background #040404   border: none
layout    [ 106px illustrated icon ]  gap 40  [ 237px text column ]
kicker    16px / 600 / #9A9A9A
title     28px / 600 / 32px line / -0.28px / #FFFFFF
bullets   16px / 400 / #9A9A9A      ← plain lines of text
footer    14px / 400 / #9A9A9A
```

Three things fell out of that, and all three were what was wrong with mine:

1. **No border.** Norvin's card has none. Mine was a 1px outlined rounded
   rectangle, which is the single most generic object on the internet.
2. **No pills.** Every list item on Norvin is a plain line of text. Mine had
   the stack as pills and the deliverables as pills — a card made entirely of
   pills reads as a template because it is one.
3. **A real graphic.** Every Norvin card carries a 106px illustrated icon. That
   is the thing a card is actually *for* — something to look at. Mine had three
   22px favicons.

### What the card is now

A **specimen plate**, in the vocabulary the rest of the site already speaks —
ghost numerals, hairlines, mono labels, bone on black.

- **A drawn diagram across the top, edge to edge.** Five bespoke SVGs in
  `labs/assets/svc/`, 640 × 190, built in the same idiom as the menu frames:
  faint 32px grid, radial wash, one path at full strength and everything else
  held at 8–20%. They are diagrams of the actual work, not clip art —
  · **ai** a network resolving to one answer with an eval check
  · **cloud** one request crossing edge / services / data, beside a capacity
    step holding above a rising load curve
  · **web** an interface frame resolving into API → domain → Postgres
  · **mob** two devices sharing one API and one domain layer
  · **iot** sensors in the field reporting over MQTT to a watched dashboard
- **No outline.** A panel a shade above the page
  (`linear-gradient(#14120F, #0D0C0A)`), lit along its top edge and dropped
  into the background by a long shadow, so it has a front and a back.
- **Ruled rows, not pills.** Three deliverables, each on a hairline, each with
  a mono index — how a specification sheet has always been set.
- **The stack as one line of monospace** with 17px marks, desaturated on the
  cards either side and at full colour on the one in focus.
- 605 × 579 at 1920. Substantial. The complaint was that small cards weren't
  cutting it, and they weren't.

### The keywords came back

Stripping the body copy in 122 took the positioning language with it. Each card
now carries a real paragraph built on *"AI-native software products for
companies that need serious engineering"* — retrieval-augmented generation,
evaluation harness, infrastructure as code, service levels and on-call, typed
end to end, offline-first, release trains, MQTT telemetry, provisioning,
over-the-air updates. Written so a non-technical buyer can follow it and a CTO
can tell we've done it.

### Mission photograph

`hero-02.jpg` (the Seine bridge) is out. I audited all 245 raster files in the
project against what the seven pages actually reference: 42 used, 203 not. The
strongest unused monochrome frame is `assets/cta-bg.jpg` — a real documentary
shot of someone standing at a workstation in the studio at night, guitars on
the wall behind. Cropped to 3:2, shadows lifted 6% so it isn't a black
rectangle on a black page, saved as `labs/assets/img/mission-desk.jpg`
(1560 × 1040, 138 KB). It is honest, it is ours, and it is the only candidate
that shows a person doing the thing the copy claims.

### Orange, again

Found four places the old `--acc: #FF4B1F` was still coming through as text on
Labs: the `+` on the stats, `.ai-proof-link`, `.cmt-foot-link` and the FAQ
arrow. All pulled to the bone ramp, along with the green success message. The
per-client `--tint` in the Work section is deliberately left alone — those are
real brand colours on real screenshots of real client sites, not site chrome.
Say the word and they go too.

### Verified
- 1366 / 1440 / 1920 / 390 — `scrollWidth === innerWidth` on both pages
- card 506×475 → 605×579 → 335×484; title ramps 22 → 38px with no frozen band
- drag: takes hold, tracks the pointer, snaps one card, dots follow
- autoplay 4.6s, stops for good on hand interaction
- no console errors, no broken images, all five diagrams XML-valid

### Revert
- cards: markup block under `[data-lsv-track]` in `labs/index.html`; PART 14 in
  `labs/assets/css/manzar-theme.css`; pre-change copies at
  `/tmp/labs.pre-cards.html` and `/tmp/theme.pre-cards.css`
- diagrams: delete `labs/assets/svc/`
- photograph: `labs/index.html` mission `<img>` back to `../assets/hero-02.jpg`
- orange: the "black and white" block above `.stat-big i`

---

## 125 · Six requests, one pass

**Services cards, visual-first.** The ruled rows and the long leads are gone.
A card is now: the drawn diagram plate, the title, ONE line, and the stack as
real tiles — each technology in its own soft square, the actual brand mark at
24–32px with its name beneath, colour on the focused card, grey on the
neighbours. One quiet mono keyword line pinned to the floor (RAG · Voice
agents · Eval harness…). Card height fell ~100px; word count fell by ~70%.

**From idea to launched.** Each stop keeps exactly one concrete line — the
"you leave with". The paragraphs and the "your part" asks are gone. The scrub
got an instrument: a large gradient-ghost clock above the rail's right end,
driven by the same ScrollTrigger as the fill — WEEK 00 → 01 → 02…06 across the
first four stops, then it flips to DAY and runs 00 → 90. Rail fill and lit
nodes went from orange to bone with a soft glow (strict monochrome). Verified
live at five scroll positions: fill 0→5, clock Week 00 / 01 / 02 / Day 00 /
Day 90, lit 1→5.

**The billing assistant plays itself.** ~200 lines in main.js + CSS states.
The question types character-by-character into the composer (blinking caret,
send chip presses), the bubble lands, the assistant thinks (three dots), then
a dashed tool card shows the retrieval as it happens — billing_ledger · 1
match · INV-4471, payments_api · status cleared, invoice_4471.pdf retrieved —
then the sourced answer. "Refund it." types; policy check runs visibly
($8,240 over the $5,000 limit); the reply is HELD FOR APPROVAL with an
approval card (Sara Malik · Finance · Waiting…) which flips to Approved ·
09:31; the refund confirmation lands with reference. Holds five seconds,
fades, loops. The thread is a fixed-height window that fills from the floor
like a real messenger, so the panel never resizes. The paced clock counts
only while the tab is visible AND the panel is on screen (elapsed-time based,
so timer throttling cannot slow it), IO has a rect fallback, and reduced
motion keeps the static transcript. Header badge now says "Live demo".
Verified: full loop start → gate → approval → confirmation → reset observed
live; loop restart caught on screenshot.

**Proof section.**
- *Preload:* six iframes now mount up front, one per project; their sources
  are set as soon as the page's own load event fires (450ms stagger). A reel
  change is a class flip + the dip-to-black — no network, no wait. Verified:
  all six frames srcʼd, switch to Broadside instant, status "Loaded ·
  Broadside".
- *Cinematic focus:* pointer over the stage adds .is-focus — the stage eases
  up (scale 1.026, 1.042 while driving), wings and slate dim to 42%/26%.
  GSAP leaves inline opacity:1 on revealed wings, so the dim carries
  !important, tightly scoped. Verified 0.42 computed.
- *The hint* grew from a 12.5px whisper to a proper pill: pointer glyph,
  clamp(13.5px→16.5px) text, 13×22 padding, real border and shadow.
- *Copy:* all six lines rewritten as client-facing one-liners (Northlight's
  "re-themes the whole site live" line removed as asked; Belleville's "cut
  like a film reel" gone; each is now a plain professional description).

**Preloader holds two full seconds.** Both pages now play the full preloader
on every plain load and refresh; the only skip is a Studio↔Labs crossover
(both crossover flags checked synchronously — the shared curtain owns those).
Studio: count 2.3s, curtain at 2.95s — clean logo hold ≈2.25s. Labs: count
2.6s + 0.35s beat at 100 — hold ≈2.3s. Verified by driving GSAP's root clock
manually (the tab was backgrounded, where rAF pauses): logo 100% opacity
through the hold, count 00→100, curtain lifts, display:none lands.

**Cursor.** The custom dart stays for movement; every clickable — links,
buttons, menu rows, accordions, reels, dots — now shows the browser's native
hand (cursor:pointer replaces the base64 hand image in cursor.css, same
selector list, all 7 pages). The I-beam and not-allowed states are unchanged.

**Also:** the assistant's green status dot and the last --acc tints in the
gate bubble went to bone (monochrome sweep).

**QA:** 1366/1920/390 srcdoc probes — no horizontal overflow anywhere; cards
479×379 / 585×480 / 335×426; clock 102/144/64px; chat window 410/470/330px.
Fresh reload: zero console messages. HTML tag-tree balanced on both pages;
CSS braces balanced; node --check clean.

### Revert
- cards: /tmp/labs.pre-cards.html + this entry's diff in labs/index.html;
  tiles CSS is the ".lsv-tiles" block in manzar-theme.css PART 14
- timeline: /tmp/labs.pre-jr.html, /tmp/style.pre-jr.css; clock JS is the
  setClock block in main.js
- sim: the aiSim IIFE at the end of main.js + the "live simulation" CSS block
- proof: /tmp/labs.pre-mach.html, /tmp/main.pre-mach.js; focus CSS block in
  style.css
- preloader: index.html "preloader + hero intro" block; main.js skipPreloader
- cursor: assets/css/cursor.css (hand image lives in git history of
  manzar-studio-site)

---

## 126 · The eight-point pass

Snapshot of everything as it stood before this pass:
**Backup/2026-08-20-pre-overhaul/** (README inside explains restores).

**1 · The timeline clock no longer jumps.** Week six IS day forty-two, so
that is what the clock does now: WEEK 00 → 06, then the same instant reads
DAY 42 and rolls on to 90. One monotonic quantity, a change of unit rather
than a jump. The displayed number is eased toward its target every frame so
digits roll instead of skipping; scrub smoothing went to 1 and the range
got a third more travel. Each stop also carries one descriptive line again
(jr-desc), kept under twelve words.

**2 · What We Build is a gallery walk now.** The card carousel is gone.
The section pins and vertical scroll walks five full spreads horizontally,
snapping each onto centre: a giant cropped numeral behind the copy, the
drawn diagram on its own lit plate, the stack as real marks with names,
title + one line + keyword rule. A HUD (01/05, progress rail, KEEP
SCROLLING) rides the pinned frame's floor. The numeral and the plate drift
at different rates while the room slides. Under 900px, on touch, reduced
motion or no GSAP, .wb--flat lays the same spreads out vertically, nothing
pinned. `overflow-x:clip` on .wb keeps the 500vw track out of the page's
layout width (verified scrollWidth === innerWidth pinned and unpinned).

**3 · Em-dashes.** All visible copy swept across all seven pages: 37→0
visible on Labs, and every remaining hit on the others is inside code
comments or is the year-range "2019—" metric. Sentences were rewritten,
not just re-punctuated.

**4 · Preloader halved, and given a face.** Studio: count 1.2s, curtain at
1.55s (was 2.95). Labs: count 1.3s + 0.2 beat (was 2.6 + 0.35). Both carry
a thin luminous progress rail under the wordmark, filled by the same value
as the count.

**5 · The demo approves its own refund.** The M avatar is gone; the panel
is wider (920px) on a soft pool of light; typing runs on a human cadence
(quick runs, beats at spaces, longer at punctuation, occasional
hesitation); messages sit on the floor of the thread like a real
messenger. The gate now shows Sara's card with real Deny / Approve
buttons, and a drawn cursor enters the panel, travels to Approve,
presses it (button and cursor both depress), the card flips to
"Approved · 09:31", and the confirmation lands. Caught mid-travel on
screenshot; full loop verified twice.

**6 · Enterprise & connected got its diagrams.** Two new plates in the
menu-frame idiom: ERP modules (HR/FINANCE/INVENTORY/OPS) feeding ONE
PLATFORM over an append-only audit trail; a device fleet reporting through
a GATEWAY to a watched screen with commands flowing back. The five
controls each carry a drawn glyph (lock, key, shield, pin, file). The
orange kickers went to grey.

**7 · Interface & Interactive.** Editorial index rows: mono numerals,
names at clamp(23→44px) that light on open, the media panel now the hero
of the open row (right, plate shadow, slow settle-zoom from 1.06),
copy alongside. Height cap raised so nothing clips at 2560.

**8 · Cinematic focus, unmistakable now.** Stage scale 1.05 (1.065 while
driving), wings and slate to 28%/16%, the glow comes up to .66/.9.
Verified computed 0.28 with transitions disabled.

**QA:** preloaders timed on both pages; walk verified at five scrub
positions (pin, spacer, tx 0→-10240, idx 01→05, fill, active classes) and
at snap-settled state; clock Week 00 from fresh load; approval flow caught
live; reg plates load (640w naturals); ds glyphs 4/4; 390px probe flat
with no overflow; zero console messages across reloads.

### Revert
Backup/2026-08-20-pre-overhaul/ restores any file wholesale. Granular:
walk = .wb block in labs markup + PART 14 + wbWalk() in main.js; clock =
clockGoal/clockPaint in main.js; approval = the gate sequence in aiSim;
preloader = .pre-rail/.preloader-core blocks + the two timing edits.

---

## 127 · The pin was poisoning the page

**Root cause, found and verified live.** The ScrollTrigger pin on the walk
inserted a ~4,500px spacer. On every refresh, ST reverted the spacer,
re-measured every trigger, and failed to re-apply the pin's offset to the
triggers BELOW it — their starts came out exactly one spacer short
(measured: svc-regulated start 7348 vs true 11819). Every below-walk scrub
was frozen at its end state, which is why the section-numeral parallax
went static. disable()/enable() fixed a trigger; the next refresh broke it
again. So the pin itself had to go.

**The walk now pins with CSS sticky.** No spacer, nothing to re-measure:
.wb gets its height from JS (100svh + 92svh per doorway), .wb-pin is
position:sticky, and a ~60-line driver eases a transform toward scroll
progress with frame-rate-independent damping. Free flow, no snap (the ST
snap was fighting Lenis). Verified: pinTop stays 0 through the whole
travel, tx 0→−10240, idx 01→05, and — the point of it all —
**the parallax below breathes again** (start measures true, --pg sweeps
−137→−37, ghost opacity swells toward centre exactly as before).

**Photography replaces the drawn plates** where they weren't earning it.
The proxy blocks external image CDNs, so the set is the studio's own
unused monochrome frames, regraded to one look (grayscale, 1600px,
consistent contrast):
- walk: signal pulse (AI), grid atrium (Cloud), light ribbons (Web),
  car at speed (Mobile), oscilloscope traces (IoT), each with a small
  mono caption chip
- Enterprise: the dome interior (one structure, many parts) and the Arc
  at night (the field, watched), same chip treatment

**Walk fixes from the review:** numeral smaller (clamp 150→320px), whole,
seated below the nav (pin carries nav clearance padding); panels padded
for the HUD; stack tiles as square plates (mark centred, name under,
colour on the live spread); free damped scroll.

**Enterprise:** the five controls are cells now — glyph, right-aligned
numeral at 13px, title, and one plain-language line each ("Every change
recorded. Nothing silently overwritten."). Tags quieter. Kickers grey.

**Interface & Interactive:** media capped at min(44vw, 660px) so the
open row fits the viewport at 2K; copy sized up.

**Design systems:** each drawn icon now sits in its own 64–80px seat.

**QA (foreground, real frame rate):** 1366/1440/1920/390 all
scrollWidth===innerWidth (one 67px spill at 1366 from the services head
glow fixed with overflow-x:clip on .lsv — clip creates no scroll
container, sticky verified unaffected); no broken images; no console
messages; walk screenshots at spreads 1, 3, 4; Enterprise cards,
controls, Interface row and DS cards all screenshotted.

### Revert
- /tmp/labs.pre-sticky.html and Backup/2026-08-20-pre-overhaul/ (whole files)
- photos: labs/assets/img/svc/*.jpg; the drawn diagrams remain at
  labs/assets/svc/*.svg if wanted back

---

## 128 · The review pass on the walk and friends

**The static "02" explained.** The section-header parallax loop bound
`.svc` only, and the walk's section is classed `.lsv` — so its numeral was
the one on the page that never moved. It joins the loop now
(`'.svc, .lsv'`), verified live: --pg sweeps as the head crosses the
viewport, identical to the sections either side.

**The walk got its style pass.**
- *Diagonal spread:* copy rides high-left (margin-bottom up to 140px),
  the photograph rides low-right (matching margin-top). The numeral fills
  the corner the copy vacates.
- *Stack, bare:* no plates, no containers — the real marks at 22–27px
  with mono names in one row under a hairline, desaturated off-spread,
  full colour on the live one.
- *The hook:* when scrolling goes quiet mid-doorway (170ms), the walk
  commits — 30% into the next room in your direction of travel carries
  you forward, short of that settles back. The glide runs through
  lenis.scrollTo so it feels like the page's own scroll. Verified both
  directions: forward at 42% → next (landed on the exact 1118px stride),
  backward at 28% → returned.
- *Photography:* AI = the poster corridor (retrieval made literal),
  Cloud = the Bir-Hakeim colonnade (infrastructure marching off),
  Mobile = the motorcycle pan (speed with a subject), IoT = the Orsay
  clock face (telemetry, watched). Web keeps its ribbons. All graded to
  one monochrome look from the studio's own Paris library.

**Enterprise & connected.** The fleet card's photograph is now the car
at speed (freed by Mobile's change) — far closer to "hardware that
reports for duty" than the monument was. The five control cells follow
the design system on hover: the outline glows (inset ring to .24 plus a
soft cast), the interior stays dark.

**Design systems.** The drawn icons and their seats are gone; the
original typographic glyphs (Aa ⌘ ¶ ◎) rest bare on the cards, in bone.

**Billing assistant.** The panel takes more of the row
(.78fr/1.22fr, width to 1020px measured live) and the thread breathes
taller.

**QA:** zero console messages; 1366/1920 no overflow, 390 flat and
clean; snap verified on the stride both directions; parallax verified
numerically on .lsv and .svc-regulated; all new photographs loading
(naturals confirmed); spreads 1 and 5, DS cards and both Enterprise
cards screenshotted in the foreground tab.

---

## 129 · The walk, once more with feeling

**Numerals whole, content lower.** The panel ghosts had line-height .86
and a negative top inside an overflow-hidden panel, so their caps were
shorn off. Now line-height .98, top clamp(16→48px), font a touch smaller;
the copy block carries margin-top so the whole spread sits lower, clear
of the nav.

**The end-hold.** The section's height now carries a 1.7-viewport tail
beyond the last doorway: progress clamps at 1, so spread 05 stays on
stage for two-to-three more scroll notches before the page releases.
Verified: pin top stays 0 with 05 on stage through +1325px past the last
doorway (screenshot), releasing after the tail.

**The driver reads the rect, not a cached offset.** A mid-session window
resize re-flowed everything above the section and left the driver's
stored top ~1600px stale, freezing the walk at 02. Progress is now
computed from the section's live getBoundingClientRect() every scroll
event, and the snap's target is derived the same way. Nothing above the
section can lie to it any more.

**Head parallax, properly this time.** The section is six screens tall,
so triggering the numeral drift on the whole of it spread 150px of
travel across ~7,700px of scroll — imperceptible, which is what was
reported as "static". The .lsv section's trigger is now its own
.svc-head: a 1,308px window (measured), the same visual behaviour as
From idea to launched.

**The photographs are the field's own.** The user asked for real HD
imagery of the disciplines rather than metaphor. The sandbox proxy
blocks image CDNs, and the extension rightly refuses to carry binary
data out of the page, so the honest route: the five figs point directly
at Unsplash's CDN (imgix crop 1600×1000, q80) with the previous local
frames kept as onerror fallback for offline file:// opens. The page's
own grayscale grade keeps them monochrome. Picks (all high-vote Unsplash
frames): a wireframe neural sphere (AI), the cabled server aisle
(Cloud), code on a dark screen (Web), a phone held in silhouette
(Mobile), the black circuit-board macro (IoT). All five verified loading
at naturalWidth 1600 in the live tab.

**The flanking dividers are gone.** The two .mz-notch rules bracketing
What We Build are removed; the FAQ one (the only other) stays. Verified:
exactly one notch left in the DOM.

**QA:** zero console messages; 1366/1920 no overflow; 390 flat; spread
01 and the held 05 screenshotted with the new photography; parallax
window measured compact; notch count 1.

---

## 130 · The polish round on the walk

**The hard slice is gone.** Any spread caught mid-transit was being cut
by the pinned frame's edge — that was the "odd margin". The frame now
carries a 3.5% mask fade on both sides, so a spread in motion dissolves
at the edges instead of being sliced. The numeral moved inboard of the
fade so its resting edge never dims, and it dropped a size
(clamp 135→280px) so it reads whole even in motion.

**The tail is half a screen.** 1.7 viewports of hold was reading as
"the site stopped"; it is now 0.55 (measured 470px at the live window),
one to two notches, then release.

**Captions and dashes.** All five figcaption chips and both Enterprise
plate captions are gone (the billing assistant's header figcaption
stays — that is the chat bar, not an image caption). The hairline dash
before each keyword line is gone across all five spreads.

**Imagery, third pass.** AI is now a black-and-white liquid wave field;
Web a dark multi-monitor workstation running code; Mobile the black
iPhone glowing "Hello" on a dark desk (948-vote frame); the fleet card
fibre-optic runs into a rack switch. Cloud's server aisle and IoT's
circuit-board macro stay. All Unsplash CDN with the previous local
frames as offline fallback; all verified loading at 1600px naturals.

**The five control cells** under Enterprise now belong to the Design
Systems card family outright: same border, background, radius, and the
same hover (lift −6px, border to line2, background to card2).

**QA:** all five walk images + fleet at naturalWidth 1600; zero image
captions in the DOM outside the chat header; tail measured 470px;
spreads 01/03/04 and both Enterprise cards screenshotted live.

---

## 131 · The cut digits, actually solved

Three rounds of position fixes never touched it because it was never
clipping. The numerals are transparent text painted by a gradient via
background-clip:text — and a background only exists inside the
element's own box. With line-height .98 the digit caps rose ABOVE that
box, where there is no gradient to paint them: unpainted ink, which
looks exactly like a razor cut across the tops and follows the glyph
wherever you move it.

Fix: line-height 1.12 with .04em vertical padding (and the same for the
flat-mode ghost), so every part of the ink sits inside the painted
area. Verified on screenshots of ALL FIVE spreads: 01, 02, 03, 04, 05
all render complete, rounded tops, gradient intact.

---

## 132 · The cut digits, round two: it was the paint, twice over

Round one fixed real unpainted ink above the box (line-height). But the
complaint persisted because of a second, worse paint problem: the
gradient fill ran from 11% alpha down to 1.4% across the full line box.
Canvas metrics showed the ink occupies only the 25-85% band of that box
(font ascent 283px vs actual cap ink 192px at 280px size), so the
digits started a third of the way down the ramp and their lower halves
were painted at ~1.6% alpha - a luminance delta of a few RGB levels,
invisible on a normal monitor. Not clipped: painted invisible.

Fix: the gradient stops now bracket the measured ink band -
rgba(bone,.13) at 22% to rgba(bone,.05) at 86% - so the fade survives to
the bottom of every stroke. Verified on live screenshots: 03 and 05
(the two reported) plus 01/02/04 all render complete, top arcs to
bottom bowls.

Lesson recorded for future me: "verify visually" failed twice because
faint-but-present and invisible-on-a-real-monitor look identical in a
compressed screenshot. The working check was numeric: measure the ink
band (canvas actualBoundingBox) and the alpha painted across it.

---

## 133 · The cut digits, endgame: it was the mask

Three real bugs stacked on one symptom. Round one: ink rising above the
painted box (line-height). Round two: the gradient floor at 1.6% alpha
painting lower halves invisibly. Round three - the one the user kept
catching - the frame's EDGE-FADE MASK: mask-image on .wb-pin faded the
outer 3.5% of the frame to transparent, and any numeral ink near an
edge (which is where the parallax drift puts it, especially
mid-transit) was ERASED. The left stroke of the 0 in their crops was
the tell.

Fix, belt and braces:
- the mask is gone entirely; the side fade is now two ink-coloured
  gradient overlays painted OVER the edges (z4, under the HUD). On a
  solid background they look identical, and paint cannot delete ink.
- the ghost starts at clamp(72px,5.2vw,140px), clear of the overlay
  strip, and its parallax drift is clamped from 84px to 26px so it can
  never wander into the edge zone.

Verified live on screenshots in BOTH reported states: spread 05 settled
and the 04→05 transit caught mid-slide - numerals complete, left
stroke to bottom bowls, on every check.

---

## 134 · The five. Definitive.

The user was pointing at the LAST digit all along. Canvas metrics
nailed it: with letter-spacing -0.055em the trailing negative advance
pulls the element's right edge 15.4px into the final glyph, and the
"5"'s ink measured 318.5px against a 309px paint box - 9.5px of the
glyph physically outside the painted area. Fourth face of the same
disease: background-clip:text only paints ink inside the box.

So the mechanism is gone. The numerals now use plain low-alpha colour
(rgba bone .085) - no gradient, no background-clip, no paint box to
satisfy. Ink is painted wherever it falls, by definition. This cannot
recur.

Verified: computed style confirms color fill + background none;
screenshots of 05 and 03 show every stroke complete, including the
5's top flag and right side and the 3's bowls.

---

## 135 · Chat seam, cursor manners, hover parity

**Loop.** The old order removed the fade class before clearing, so a
frame of stale transcript flashed at full opacity every loop. Now:
fade out → innerHTML cleared WHILE invisible → the empty window fades
back in → typing begins. The static no-JS transcript leaves through
the same fade on first run. Verified live by state sampling:
ok:4 → CLR:4 → ok:0 → ok:1... — no state ever shows old content
after the fade.

**Approval cursor.** Born at the panel's centre (was the composer
corner), glides to Approve, and the dart swaps to a drawn pointing
hand the moment it arrives over the button — the same clickable-cursor
grammar as the site itself. After the press the approval registers and
the hand vanishes in ~120ms rather than a slow fade. Verified live:
[IN+HAND] → [IN+HAND+APPROVED] → [GONE] within one sample beat.

**Hover parity.** The Enterprise control cells were styled to
style.css's --card2/line2 values while the Design Systems cards get
their hover from the theme's quiet-cards override (.045/.18) — close
but not the same. The cells now sit IN that override's selector list,
so base and hover are the same rule, not a copy. Verified with a real
mouse hover: bg .024→.043, border .10→.18, byte-identical to ds-card.

Ready for the hero rework next.

---

## 136 · Hook feel, hand timing, gate chip

**Hook.** Idle-to-commit 170→110ms, glide .8→.55s with a slightly
fuller ease, and the track damper tightened 5x - the mushiness was two
soft easings stacked (the glide's own ease plus the track lagging
behind it through its damper). One easing now owns the move.

**Hand cursor.** The dart flips to the pointing hand DURING the
approach (520ms into an 850ms travel), so it arrives over Approve
already clickable - no beat of an arrow resting on a button. Travel
shortened 1.05s→.85s, hover-to-press tightened.

**HELD FOR APPROVAL.** Was inline-flex inside the paragraph, sitting on
the same line box as the sentence - one broken-looking line. Now
display:flex width:fit-content with chip styling (pill bg .07, inset
ring, 5x10 padding): its own row by construction. Verified on
screenshot: chip row, then the sentence, then the cite.

Snap and cursor sequencing were foreground-verified in rounds 128/135;
this round only tightens their constants. Next: the Labs hero rework.

---

## 137 · The silk hero

Labs opens on charcoal silk now, relit live in WebGL - the same engine
family as the Studio hero, re-tuned for fabric.

**The bake.** Charcoal_silk_fabric_folds.mp4 (1920x1080, 24fps, 10s)
slowed to 0.8x (12.5s loop, crf23, 7.1MB). Normals derived per frame at
960x540: dual-scale gradients (sigma 2 for the weave, sigma 7 for the
fold domes, 35/65 blend), K=14, temporal EMA 0.42 against flicker,
encoded at 335KB. Sign convention sanity-checked by simulating the
shader's own lighting in Python before baking: light left lights the
left flanks, light right the right (screenshotted proof).

**The engine** (labs/assets/js/hero-silk.js, ~260 lines, dependency
free). Two A/B-looped videos as GL textures - footage + normals - with
a 1.1s crossfade seam. Cursor-keyed key light with pooled falloff and
LIGHTZ .72 rake; specular pow 62 at .34, diffuse .42, whisper of
aberration (.0005), soft focus falloff, toe lift so the blacks breathe,
grain, quiet vignette. Idle >2.6s, the light wanders the folds on its
own. Fallback ladder: relight -> plain looping video -> still (poster
baked from frame one). Reduced motion renders one lit frame and stops.
Dial API (window.__hero.set) kept for tuning. file:// gets a base64
shim (9.9MB) exactly like Studio; http(s) streams the real files.

**The layout.** The giant Manzar SplitText beat and the shell-inset
scroll survive. Gone: the grid lines and plus marks (the silk needs no
scaffolding) and the hero social icons (per request). Added: a mono
facts column bottom-right (Based / Since / Live in) and a second ghost
CTA (Start a project). Sub, avatars, 40+ count, blurb and See-the-work
all preserved verbatim. The heavy text shade eased back for the darker
footage; heroIntro's zoom retargeted to the media block; the orphaned
grid tween removed (was warning in console).

**Verified live:** engine ticking (ready 4, no error) over the file://
b64 path; relight direction proven at three light positions with
screenshots; no overflow; console clean after the tween cleanup.

**Revert:** Backup/2026-08-20-pre-overhaul/labs-index.pre-silkhero.html
for the markup; delete hero-silk.js + the PART 15 block; main.js
heroIntro selector back to '.hero-img, .hero-video'.

---

## 138 · Silk hero v2 — studio-lit, not cursor-lit

All four complaints traced to real causes and rebuilt:

**Quality.** The 0.8x retime left 24 unique frames stretched over 12.5s
(judder), and crf23 banded the dark gradients. v2 is native speed,
crf16 preset veryslow with gradfun deband - 11.3Mbps, and the weave
detail actually reads now.

**The loop.** No more A/B runtime crossfade (that was the visible
fade). The seam is baked into the file: the clip's first 1.5s is
crossfaded into its tail at encode time, so the last frame IS the first
frame (measured mean diff 3.6/255) and playback is a native `loop`.
The normal track got the same treatment plus a two-pass EMA so its
smoothing state wraps (seam diff 1.5/255). Verified live: 8.30 → 0.11
across the boundary, no visible event.

**The cursor.** All pointer coupling is gone - no light follows the
mouse, no focal blur, no aberration (both removed entirely; the frame
is sharp edge to edge). The light is autonomous: a key that orbits the
cloth over ~60s with a breathing elevation, like a rig move on a
product film.

**The shading.** This is where the normal map now earns its keep:
- wrap diffuse from the orbiting key - whole folds brighten and die
  down as the light passes (DIFF .34)
- ANISOTROPIC sheen: the normal is squashed across X so the specular
  lobe streaks along the folds - silk reflects along its threads, not
  in points (pow 84, .38, aniso .45)
- a whisper of silver rim on fold edges (N.z falloff)
- filmic toe lift, gentle vignette, animated grain that also dissolves
  any residual banding
Verified at three orbit phases with screenshots: the sheen visibly
migrates across the cloth, differently lit each time.

**Layout.** The duplicate Start-a-project CTA is gone (navbar owns it);
hvB removed from the DOM; normal-track sync hardened (render-level
catch + seeked handler + 700ms nudge).

Engine: labs/assets/js/hero-silk.js (v2, ~230 lines, dependency-free),
dial API window.__hero.set({diff,spec,specpow,aniso,rim,lift,grain,
orbit,elev,phase}) kept for tuning.

---

## 139 · Hero v3 — the lens rides the light

Removed from the hero: the Based/Since/Live-in facts column and the
scroll cue line. The SH/PV/SG initials are now three app-icon chips
carrying real glyphs (Lucide box, activity, aperture - ISC licence,
fetched through the browser), each on its own subtly tinted dark chip.

The background gets the Studio hero's lens texture back, but tied to
the autonomous key light instead of the cursor: wherever the orbiting
key strikes the cloth is where the lens focuses - away from it the
frame melts into soft glass (5-tap variable defocus, .0065), with
radial chromatic dispersion (.0019) and bloom (.34) where the sheen
gathers. As the key orbits, the focus plane, the dispersion and the
sheen all travel together, so the whole frame breathes like a rig move
with a fast prime. Verified at two orbit phases: focus visibly
migrates, chroma reads intentional on the fold rims, in-focus weave
stays crisp. Dials extended (blur/focr/ab/bloom live).

---

## 140 · Hero v4 — slower, sharper, branded

**Icons.** The chips now carry actual product marks - Shopify, Stripe
and Figma from the simple-icons set (canonical SVGs via npm), each in
its brand colour on the dark chip. Recognisable products, not glyphs.

**The footage.** Slowed 25% the right way this time: retimed and
interpolated to 60fps (blend interpolation - the full optical-flow
pass was killed after stalling 20+ minutes; on silk this slow the
blend is indistinguishable and renders in two minutes). The loop was
rebaked at 60fps with a 2s self-crossfade - seam diff 1.5/255, native
loop, no runtime fade. crf16/17 with deband; 18.3MB streamed, 11.23s
per revolution. Normals rebaked from the new timeline at 30fps with
the wrap-continuous EMA (596KB).

**The shader.** The lens direction (blur + chromatic dispersion) is
dead - it read as low quality twice and stays gone. v4's grade goes
the other way entirely:
- CLARITY: unsharp micro-contrast on the weave (.55) - local contrast
  is what reads as expensive, never softness
- filmic S-curve (.38) over a lifted toe - blacks breathe, highlights
  roll
- a slow breathing zoom (1.00-1.045 over ~70s) so the frame drifts
  toward you and back with zero loss of sharpness
- the orbit relight, anisotropic sheen and rim from v2 stay
- fine animated grain (.034)

Verified live: 60fps file playing (duration 11.23 read from the
element), engine clean, brand chips rendering in colour, weave crisp
at rest and in the breath.

## 141 — Labs hero v5: the atlas (2026-08-21)

The three complaints, and what actually fixed each:

**The loop pop.** v4 ran two videos — footage and its normal map — as separate
elements. Each looped on its own clock, so they wrapped at slightly different
instants and the lighting visibly jumped at the seam. v5 stacks both into ONE
file: `silk.mp4` is now a 1920×1620 atlas (color on top, normal strip below,
built with ffmpeg vstack). One element, one clock — the lighting cannot desync
at the wrap even in principle. The file itself is still self-xfade loop-baked,
so frame N == frame 0.

**"Super low quality."** New cinema-glass pass in the shader, in optical order:
gate weave (sub-pixel wobble, like film in a projector) → corner-true chromatic
aberration (radial, ×r², zero at center where the type sits — fringes only at
the frame edges, like a fast lens) → clarity unsharp → relight (wrap diffuse,
anisotropic silk specular, rim) → anamorphic streak bloom (horizontal silver
bleed off the bright crests) → halation (soft diagonal emulsion glow) → filmic
S-curve + toe lift → vignette → grain. Dials exposed on `window.__hero.set()`.

**Pacing.** playbackRate 0.85 on the 60fps retimed source (≈0.64× original).
Caught in browser verification: `load()` silently resets playbackRate to 1 —
now pinned via defaultPlaybackRate + re-asserted on loadeddata. Verified 0.85
live.

Also: flat (no-WebGL) fallback CSS crops the atlas so the normal strip never
shows (`height:150%; object-position:top`); file:// shim is a single HERO_VID
var; silk-normal.mp4 deleted everywhere; deploy b64 shim refreshed to atlas.

**Verified in browser:** engine ready, no errors, atlas 1620px detected, rate
0.85 after load, wrap 10.9s→0.09s clean on the single element, screenshots at
two orbit phases show streaks/CA/halation sitting where intended.

**Revert:** `Backup/2026-08-20-pre-overhaul/labs-index.pre-silkhero.html` +
restore silk.mp4/silk-normal.mp4 from that backup set; or git-revert deploy
commits 0520318 + 787e0a8.

## 142 — Labs hero v6: real normal maps, real shaders (2026-08-21)

User: the normal map is practically nonexistent; CA must be in the CENTER too;
whole thing still low quality — research properly and fix.

**He was right, with numbers.** Decoded the baked normal strip: mean surface
tilt 3.2° — near-flat, no visible light response possible. Real fabric normal
maps carry 15–45°.

**Research done** (sources in reply): Estevez & Kulla 2017 "Production
Friendly Microfacet Sheen BRDF" (the Charlie cloth distribution, via Google
Filament docs); Barré-Brisebois & Hill "Blending in Detail" (whiteout detail-
normal blend); Sundararaman's RGB→rygcbv Fourier expansion for 6-channel
spectral dispersion (via Maxime Heckel's dispersion write-up / junni.co.jp
technique, incl. luminance resaturation).

**v6 pipeline (two passes through a framebuffer, like a real post stack):**
PASS A (scene): baked normals amplified in-shader (uNAmp 2.6) + NEW tileable
silk-weave detail normal map (Python-baked: satin float pattern + FFT-periodic
anisotropic fibre noise; mean tilt 29.1°, p90 39.5°, seam-verified tileable;
512px, embedded as data-URI in weave-normal.js so file:// works) blended with
whiteout, rotated 30° so the thread grid never aligns with the anisotropic
axis (aligned it scanlined — caught in round 1 screenshots), weighted into lit
crests. Lighting: wrap diffuse from a cool orbiting key + warm counter-fill +
Charlie sheen + anisotropic gleam + thin-film iridescence (cosine spectral
palette on the sheen — the blue/violet fold edges) + rim. 5-tap pre-soften
melts codec artefacts before lighting.
PASS B (glass): 6-tap 6-channel spectral dispersion with a CENTRE FLOOR
(uCAc .0022 — fringing in the middle of frame, per request) growing r² toward
corners (uCAr .0035), every tap Poisson-jittered (the dreamy soften he asked
for as "more blurred"); anamorphic streaks + halation now sample the LIT
image; resaturation, S-curve, vignette, grain.

**Verified:** 60fps measured with both passes; no GL errors; A/B phase
screenshots show unmistakable relighting (lit crest migrates across frame);
weave reads as satin grain in the sheen; iridescent fold edges through frame
CENTRE. New dials: namp det tile sheen sheenr irid iridf fill soft cac car
soft2 sat (window.__hero.set).

**Files:** hero-silk.js (v6 rewrite), weave-normal.js + silk-weave-normal.png
(new), labs/index.html (script include). Revert: git-revert this commit; video
assets untouched from v5.

## 143 — Labs hero v7: dark cinema (2026-08-21)

User on v6: vintage/'90s-filter feel, a downgrade — revert to the previous
version's character and go DARK CINEMATIC instead.

**Diagnosis:** v6's film-era cues stacked into a period look — iridescent
rainbow (reads as VHS color misregistration), warm amber fill (sepia), 6-tap
dispersion + jitter (old-lens haze), gate weave (projector wobble), halation
(emulsion glow). All removed.

**v7 = v5's single-pass architecture (the version he preferred) + the one
v6 win (normals you can see) + a dark-cinema grade:**
- kept: amplified baked normals (uNAmp 2.4) + rotated weave detail
  (uDet .20, crest-weighted) — the visible relight; Charlie sheen kept
  SILVER (no iridescent tint); single cool key, no warm fill.
- CA: back to three clean taps (digital-lens fringe, not rainbow haze),
  small centre floor (uCAc .0012) + r² growth (uCA .0032) — still present
  mid-frame per the earlier request, but restrained.
- grade (researched): steel-blue shadows / silver highlights split tone,
  then the ACES filmic curve (Narkowicz fit — the Academy tone curve,
  UE4's default) with exposure dial + black crush .010: deep toe, rolled
  highlights, nothing clips flat. Deeper vignette (.86), grain .028.
- streaks kept, tinted cool (.85,.92,1.08); halation nearly off (.12 wt,
  HAL .15); no gate weave; breathing zoom softened to .03.
- micro-soften .9 THEN clarity .30 (denoise-then-sharpen, colorist order).

**Verified:** 60fps, no errors, A/B phase screenshots (16/47) show the sheen
river migrating with deep blacks and textured silver highlights; no color
cast anywhere. Dials: window.__hero.set (exp/cac/ca/namp/det/sheen/etc).

**Files:** hero-silk.js only (weave-normal.js + png unchanged from v6).
Revert: git-revert this commit (v6 look) or a59e892^ (v5 look).

## 144 — Labs hero v8: macro lens (2026-08-21)

User on v7: still not satisfied — different direction, "maybe some cool blur
effect", wants higher quality.

**Direction change: optics, not another grade.** Seven versions of regrading
the same sharp footage each read as "a video behind text". v8 makes the silk
read as MACRO footage on a wide-open cinema prime:

- **Tilt-shift depth of field**: a razor-thin focus band with everything
  else melting into creamy blur. Gather is a Vogel/golden-angle spiral disc
  (20 taps — the standard single-pass bokeh pattern, per research), rotated
  per pixel so undersampling dithers into noise the grain then owns.
- **Bokeh weighting**: samples weighted 1 + luma² × uBokeh(4) — defocused
  highlights bloom into bright discs, the wide-aperture signature.
- **Rack focus**: the focus line breathes through the frame (~60s sin), so
  the image is alive even where the cloth rests. Driven by the same clock as
  the light orbit (phase dial controls both).
- Defocus erases residual codec artefacts — the honest answer to the
  recurring "low quality" perception.
- v7's dark-cinema scene kept intact in pass A (relight, silver Charlie
  sheen, cool CA w/ centre floor, cool streaks); grade (split tone → ACES →
  crush → vignette → grain) moved AFTER the lens in pass B, colorist order.
  Grain applied after blur — grain over cream keeps "soft" from "smeared".

**Dials added**: blur(26 px@1080), bokeh(4), focusw(.11), feather(.60),
racka(.15), racks(.10) on window.__hero.set.

**Verified**: 61fps, no errors; screenshots at phase 16/33 show the sharp
band migrating (rack focus live), crisp fabric texture inside focus, glowing
cream melt outside, steel/silver grade intact, no vintage cast.

**Files**: hero-silk.js only. Revert: git-revert this commit → v7 dark
cinema; 79ee4fd^ → v6; a59e892^ → v5.

## 145 — Labs hero v9: the Monolog study (2026-08-21)

User approved v8 ("Bro, it's good") → saved: Backup/2026-08-21-hero-v8/ +
git tag hero-v8-approved (22fb46d). Then: make it MORE ABSTRACT and higher
quality, benchmark bymonolog.com's hero.

**Research findings (inspected live in browser):** Monolog's hero =
THREE.js canvas animating ONE static key visual (Key Visual-2.avif,
1967×1311) over the same image at 0.6 opacity. The art itself is the whole
trick: a massively defocused abstract photograph — dark soft masses, matte
sage-grey field, a single warm ivory horizon glow — with strong crisp
photographic grain baked over the softness. Matte tonal range (no true
black in the field, no clipped white); ALL sharpness lives in the grain
and the typography.

**v9 = that recipe applied to our moving silk (engine v8 + deltas):**
- blur floor (uBlurMin 13px): the WHOLE frame is soft — silk reads as
  abstract billowing masses, not fabric; rack-focus band now just "less
  soft" (focus variation without literal sharpness)
- matte finish (uMatte .60): post-ACES lift — blacks ~#131313, highlights
  roll to ~.92, type does the contrast
- three-way split tone: steel shadows / sage-grey mids / ONE warm ivory
  event on the sheen band (uWarm .70) — Monolog's warm-glow-in-cool-field
  polarity, localized so it never reads sepia
- photographic grain: amplitude .052, 1.5px clumps, luma-weighted (lives
  in the grey mids like theirs) — crisp grain over cream
- deeper crop (zoom base 1.05), clarity .15, weave detail .14 (sharpening
  fights abstraction)

**Verified:** screenshots at phases 16/40 + live: fully abstract soft
masses, warm-kissed sheen river in cool matte field, visible grain, type
razor-crisp against it. fps measurement blocked this round (tab reported
visibilityState:hidden — rAF frozen by Chrome; heartbeat kept rendering),
cost math: 20 taps/px ≈ v6's measured-60fps league. No engine errors.

**Files:** hero-silk.js only. Revert: tag hero-v8-approved, or
Backup/2026-08-21-hero-v8/hero-silk.v8.js.

## 146 — Labs hero v10: light through darkness (2026-08-21)

User on v9: too much blur, low quality, crappy — go a completely different
direction, dark cinematic, actually good.

**Pattern locked across nine versions:** everything he liked (v5 "alright",
v8 "good") was SHARP with DEEP BLACKS; everything he hated (v6, v9)
softened or lifted the frame. v10 is built on that law.

**New concept — chiaroscuro, not another grade:** near-silhouette obsidian
silk, ONE anchored hard key (upper-right, slow ±.18rad drift instead of the
old full orbit), crests catching hard silver light, and VOLUMETRIC LIGHT
SHAFTS streaming through the frame — the GPU Gems 3 ch.13 screen-space
scattering technique (Kenny Mitchell): 24-step march from each pixel toward
the light's screen position accumulating the lit crests' brightness with
per-step decay; the silk's own highlights are the emitters. Beam structure
via value noise over the angle around the source (three drifting sin
octaves) — without it the march reads as plain glow (caught in round-1
screenshots). Border-rejected samples (top-edge smear fixed).

**Grade:** deep blacks returned (crush .012 post-ACES), matte/warm zeroed,
exposure .90, fine per-pixel grain .022 (the 1.5px clumps went), clarity
.30 back, DOF default OFF (dials remain). Blur exists nowhere by default.

**Verified:** screenshots at drift-rest + phase 8: rest state = moody
obsidian with faint amber CA rim accent; phase 8 = defined silver shafts
fanning from the bright crest, sharp fabric inside the light, type crisp.
No errors. fps unmeasurable this round (tab visibilityState:hidden freezes
rAF — also explains type-invisible intro frames in screenshots); 25-tap
cost sits in v6's measured-60fps league.

**Dials:** rayi/rayden/raydec/lpx/lpy + all prior. v8 still one command
away: tag hero-v8-approved / Backup/2026-08-21-hero-v8/.

## 147 — Labs hero v11: dense dark glass (2026-08-21)

User on v10: fucked up, don't need it, even v9 was better. New precise spec:
blurry/smooth + visible chromatic aberration + highly dense + dark shaders +
high quality + sexy.

**v11 = the approved v8 foundation + the spec:**
- rays deleted (guarded to zero, march removed); orbit light restored
- SMOOTH: v8's Vogel bokeh gather with a moderate blur floor (6.5px min,
  18px max via the drifting rack band) — everything smooth, folds still
  read. Not v9's total 13-30px wash.
- DENSE: two-ring colored BLOOM (10px + 26px, 8 taps each) with a
  SOFT-KNEE threshold [Jimenez 2014, CoD:AW post-processing — soft knee
  fades bloom in smoothly so animated highlights never pulse] — thick
  luminous atmosphere around every lit fold. Plus density contrast
  (uCon .16 post-ACES) and crush .012 → rich deep blacks, zero matte wash.
- CHROMATIC: two CA passes — pass A tight radial (CAC .0018 + CA .0048 r²)
  on the video, pass B WIDE fringe (uCAB .0035, centre floor + r²) on the
  smooth image → soft amber/cyan spectral edges visible mid-frame.
- warm .25 kiss on highlights only (sexy, not sepia); grain fine .020;
  EXP .92.

**Verified:** phase 47 screenshot: smooth structured masses, spectral fold
edges through frame centre, bloom glow, deep blacks, crisp type. No engine
errors. (Tab again visibilityState:hidden → fps unmeasurable; +18 bloom
taps keeps cost in the proven league. Phase-16 shot caught the frozen-tab
intro state — known artifact, not a defect.)

**Dials:** bloom/cab/con added; blur/blurmin/matte/warm/etc all live.
Reverts: v8 tag hero-v8-approved; v9 ab8ebea; v10 563f840.

## 148 — Labs hero v12: liquid glass (2026-08-21)

User on v11 (with his own 2560×1440 screenshot): too blurry, wrong
direction — LESS blur, some other, better effect. Note: at his fullscreen
res the blur floor scaled up and read far softer than in 1568px captures.

**v12 = v11 minus the blur, plus a signature material effect:**
- blur floor 6.5→2px, max 18→9px: near-sharp, codec-melt only
- NEW — LIQUID REFRACTION: colour is sampled where the (amplified base +
  weave detail) normals bend the view ray (`ruv = uv + N.xy * uRefr`,
  .0075). The silk warps its own image like molten obsidian — the normal
  maps finally produce an unmissable material effect with ZERO added cost
  (offset, not taps). Shader reordered: normals computed before colour;
  detail-mask luma uses a pre-tap (l0p).
- tighter chrome sheen: SPECPOW 90→120; clarity back to .26
- kept: soft-knee bloom, dual CA passes, warm-kissed highlights, deep
  blacks, fine grain — everything he didn't complain about.

**Verified:** phase 21: molten-metal ribbons, crisp edges, spectral
fringes, dense contrast; phase 47 rest state moody. No errors. Cost ≤ v11.

**Files:** hero-silk.js. Reverts: v11 810e5bf, v8 tag hero-v8-approved.

## 149 — Labs hero: v8 restored as FINAL (2026-08-21)

User on v12: "officially more fucked up than ever... RESEARCH AND ITERATE
AND THEN FINALIZE."

**The research that mattered was the twelve rounds themselves.** One build
got approved — v8, macro lens ("Bro, it's good") — approved by the user at
his native 2560×1440 with his own eyes. Every departure after it (v9
abstraction, v10 rays, v11 bloom+blur floor, v12 refraction) was rejected.
A second finding explains my repeated misjudgment: extension screenshots
downsample his 2560-wide viewport to 1568 captures, which visually hides
softness/mush — effects that read "fine" in my captures read soft or
smeared at his native pixels.

**Action: restored v8 byte-exact** (md5 verified against
Backup/2026-08-21-hero-v8/hero-silk.v8.js = 207d869...) — no tweaks, no
new effects. Live verification: dial fingerprint matches v8 (BLUR 26, no
REFR/BLOOM keys), phase-33 screenshot shows the approved character (sharp
rack-focus band, bokeh melt, deep blacks, silver key).

**Standing decision:** v8 is the baseline. Changes from here happen in
single small steps, only on request, judged against native-resolution
perception.

**Files:** hero-silk.js (restored). v9–v12 remain in git history
(ab8ebea / 563f840 / 810e5bf / 2dc92ea) if ever wanted.

## 150 — Capability subpages: full overhaul (2026-08-21)

Brief: the four capability pages (carryovers) rebuilt properly — appealing
hero/body layouts, web-sourced photography, smooth scroll + animations at
main-site polish, footer parity, cursor integrity, menu typography fixes.

**Audit found:** no Lenis/GSAP on any capability page (no smooth scroll, no
motion lib); flat wireframe-SVG heroes; dim numbered lists; footer labels/
email/logo diverged from Labs (Studios vs Offices, manzar.solutions vs
manzar.studio, text-built band logo); menu overlay's own switch/CTA at
15px:500/600 + 15.5px:600 vs system 13/500 + 14/500 (the "unusual weights").

**Shared layer (new):**
- assets/css/cap-extra.css — hero media panel (photo, duotone overlay, meta
  tag, floating glass "signal chip"), offer-card grid (replaces the numbered
  list; DS-card hover language; odd-count last card spans full width),
  full-bleed parallax image band with one serif pull-line (left-anchored,
  scrimmed), stat band, proof accent rule, next-capability doorway band,
  responsive + reduced-motion.
- assets/js/cap-motion.js — Lenis (same wheel feel as Labs) wired to gsap
  ticker; hero entrance timeline (eyebrow → clip-rise title → sub → CTAs →
  media scale-settle → chip); [data-plx] scrubbed parallax; [data-count]
  counters; leaves [data-reveal] to each page's own IO system (double-
  driving would pin elements at inline opacity 0).
- menu.css — overlay switch/CTA/mail aligned to system metrics (13/500,
  14/500, pill radius, round chip). NOTE: "slow menu fade" seen during QA
  was tab-occlusion throttling (his other window on top), not a defect —
  target opacity 1, class correct, .42s transition.

**Per page:** hero photography (Unsplash hotlink + guaranteed local
fallback from labs/assets/img/svc/ — cloud's CDN pick 404'd in QA and the
fallback engaged invisibly, proving the pattern): ai waves/rack-cables,
cloud aisle/patch-panel(fallback), mobile hello-phone/home-screen, iot
PCB/red-circuit (accent-hued). Distinct chips + band lines per discipline;
cloud + mobile get animated stat bands (uptime/p95/alert-to-human; platforms
/TestFlight-weeks/crash-free); every page gets a Next-capability doorway
(ai→cloud→mobile→iot→ai); footers matched to Labs verbatim (labels, targets,
hello@manzar.studio, Offices, wordmark-image band logo).

**Verified in browser:** all four pages walked; hotlinks/naturalWidth
checked; counters fire; menu metrics measured 13/500+14/500; lenis+gsap
present on every page. Backup: Backup/2026-08-21-pre-capability-overhaul/.

## 151 — Capability pages REBUILT FROM SCRATCH + SEO/a11y/branding pass (2026-08-21)

User on the retrofit: still the old crappy site (giant unstyled wordmark in
the footer band — my bug; old template skeleton showing through). Ordered:
rebuild each page from scratch, integral to the new site; plus a11y + deep
SEO, favicons/tab titles for both worlds, clean URLs, full audit.

**REBUILD (build_caps.py generator, outputs are now source):**
Pages are built ON the Labs stack — same head pattern (first-paint guard,
crossover gating, fonts), cursor.css → manzar-system.css → labs/style.css →
labs/manzar-theme.css → caps.css (new page layer). Nav, footer (incl. dither
band), mzx menu and the studio doorway are EXTRACTED from labs/index.html at
build time and path-adapted — parity by construction, drift impossible.
New per-page composition: full-bleed photographic hero (scrim, crumb,
display title, meta rail) → sticky chapter rail with scroll-spy → offers as
2 editorial feature rows + card grid under a ghost numeral → per-page SET
PIECE (AI: self-running eval terminal · Cloud: live status wall · Mobile:
parallax device duo · IoT: SVG pipeline line-draw with travelling packet) →
process cells → stack + tool chips → accent-rule proof → pricing pointer →
next-capability doorway (hover image) → labs studio doorway → labs footer.
caps.js: Lenis+gsap (Labs recipe), hero entrance, [data-cv] IO reveals
(gated on html.cp-js so no-JS reads everything), scroll-spy, parallax,
counters, set-piece drivers, Bayer band dither (ResizeObserver-sized).
Fixed during QA: cp-hero-in width override; toc/nav collision (top:88px);
band canvas ID rule (#cv-band-cap — labs sizes by #cv-band-labs, band had
collapsed to 300×150); MZX extraction bug (end marker preceded start → menu
silently missing; now </body>-bounded + length-asserted); local ai.jpg is a
corridor photo, not waves → plates/fallbacks re-pointed (CDN + safe locals).

**SEO (researched):** keyword-first titles ≤~55ch sitewide (AI/Cloud/Mobile/
IoT Development Services | Manzar Labs; Manzar Studio — Film, Photography &
Post; Manzar Labs — Software Engineering at Startup Speed; Pricing —
Sprints, Builds & Retainers); unique keyworded descriptions + meta keywords;
Service + BreadcrumbList JSON-LD per capability; canonicals extensionless
everywhere; robots.txt + sitemap.xml (root + deploy); vercel.json
cleanUrls:true (live URLs drop .html; file:// links untouched).

**Branding:** Labs favicon variant (accent badge on the mark) generated at
32/180/192/512 — Labs, pricing and all capability tabs now visually
distinct from Studio in Chrome.

**A11y:** aria-current on scroll-spy rail; contrast bumps on the smallest
mono labels (.35→.55); skip links, landmarks, reduced-motion, alt text
throughout; no-JS renders fully.

**Audit:** all 7 pages walked; titles/favicons verified live; full link
inventory on ai.html resolves; zero console errors sitewide. Dead retrofit
files (cap-extra.css, cap-motion.js) deleted from working + deploy.

## 152 — Footer-band parity, pricing rebuilt, anchors verified (2026-08-21)

User: sub-page footers missing the Studio/Labs footer texture; pricing,
studio and contact "pages" not reworked; photo sections must match the
main sites.

**Footer texture — root cause found and fixed.** The main pages' band is
NOT the chunky 9px Bayer dither the old cap pages used — it's glWaveBand,
a WebGL dune shader in labs/main.js (fbm-noise shoreline, rotated halftone
dots, grain, paper texture) with a fine-dither fallback. Ported VERBATIM
into caps.js targeting #cv-band-cap — all four capability pages + pricing
now render the identical dissolve by construction. Verified side-by-side.

**Pricing rebuilt from scratch** on the Labs stack (same extracted
nav/footer/menu/doorway, root-depth path adaptation): silk photographic
hero ("Quoted fixed, before we start." + Sprint/Build/Retainer meta rail),
chapter rail, three tier cards (Build flagged "Most engagements", accent
border; Who-it-suits / What-you-get / What-it-doesn't-include blocks mined
from the old page), what-moves-the-number chips, 5-item FAQ as styled
details/summary, start band, studio doorway, Labs footer. Old page backed
up as pricing.old.html.

**Studio / Contact:** these are sections, not pages — audited every menu/
footer target: index.html has #studio #work #services #reel #process
#contact; labs has #mission #speed #services #work #faq #contact. All land.

**Media parity:** feature plates gained the main-site hover breath
(scale 1.045 on row hover); photographic heroes + scrims already matched.

**Verified:** pricing walked full-page (hero/tiers/FAQ/footer); iot footer
band screenshot-matched against labs' own; no console errors.

## 153 — Page-specific navbars, richer sections, Studio removed from subpages, logo favicons (2026-08-21)

User: the sticky chapter rail under the nav behaves broken; replace the
Labs centre links with each page's OWN links in the real navbar; sections
too basic; remove Manzar Studio links/section from subpages; tab icons
should be actual logos.

**Navbar:** chapter rail deleted entirely. The main navbar's centre links
are now page-specific on every subpage (caps: The work/Up close/Process/
Stack/Proof/Pricing; pricing: The models/What moves it/FAQ/Start), with
the scroll-spy retargeted to them (accent underline via .is-here). One
navbar, no second bar, nothing riding over the footer.

**Visual upgrade:** offer cells now carry an accent top-sweep + hover
arrow, larger type and padding; process steps became numbered coins on a
shared connecting line (coin fills accent on hover); grid rhythm opened.

**Studio removed from subpages:** the film/photography doorway section
deleted from all four capability pages AND pricing (Labs keeps its own);
the menu's entire Studio column and the Company "Studio" row removed on
subpages, remaining rows renumbered 01-07.

**Favicons — actual logo:** mark extracted from brand art (bbox-cropped,
rescaled to fill 80% of canvas) and rebuilt at 32/180/192/512: Studio =
bone mark on ink, Labs = accent-orange mark on ink (distinct at a glance);
root favicon.ico regenerated (16+32). Numeric verification: mark coverage
and colors confirmed per size.

**Builders updated** (build_caps.py / build_pricing.py) so titles,
extensionless canonicals, labs icons, nav links, menu trim and doorway
removal are all IN the generators — regeneration can no longer lose
patches. All flags grep-verified across the five pages (door=0, rail=0,
studio-group=0, own-nav=1). NOTE: the browser tab was closed mid-QA and
the extension cannot open file:// URLs itself — final visual pass pending
a reopened page.

## 154 — Nav bar: difference-blend removed, constant glass backdrop (2026-08-21)

User: the header looks bad over the hero background (an "overlay effect") —
make the nav unaffected by whatever is behind it.

Root cause: `.nav` rendered in `mix-blend-mode:difference` with white text
(both Studio's inline nav and the shared labs-theme nav). Difference math
turns to mud over mid-tone/blurry photography — exactly the wash in his
screenshot.

Fix (both places — labs/assets/css/manzar-theme.css .nav for Labs + all
subpages, and index.html inline .nav for Studio): blend removed; the bar
now carries its own glass — constant ink scrim (color-mix 72% ink) +
16px backdrop blur + hairline bottom border, bone text. Clean and constant
over any hero, any photo, and over the cream footer band (where difference
used to invert). No layout/height changes; z-indexes untouched.

Not browser-verified this round: the Windows Chrome session's tab group is
gone and only the (off-limits) MacBook browser is connected — needs a hard
refresh on his side. Single-property-class change, low risk.
