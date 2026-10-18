# CLAUDE.md

Context for Claude Code working in this repo.

## What this is
First Packet: a single-page, static course site (no framework, no bundler, no dependencies) deployed on GitHub Pages. The course runs 14 sections plus a capstone, and the learner builds **Ember**, a messaging platform, across the weeks. The structure is deliberately cumulative (a "snowball"): every section lists what it carries in and what it unlocks, and problem sets reuse earlier work.

## Golden rules
- **Edit `src/`, never `index.html` directly.** Run `python3 build.py` after every change and commit both.
- No external scripts. The only external resources are Google Fonts (Inter, JetBrains Mono) and Pyodide (jsDelivr), which loads in a Web Worker only when a learner first clicks Run in the code editor.
- Keep it dependency-free and working from a plain static host.
- Progress lives in `localStorage` under the key `first-packet-v2`. Changing the shape of saved data needs a migration, or learners lose progress.
- Theme: single dark theme. Colors are CSS tokens on `:root` in `style.css`; diagrams use the hex palette object `C` at the top of `diagrams.js`.

## Content model
- `WEEKS[]` (weeks_a.js, weeks_b.js): `id` (`w0`…`w13`), `num`, `layer`, `title`, `h1`, `blurb`, `big` (HTML), `strip` (shell command or header field diagram), `ideas`, `psets`, `check`, `reads`.
- Problem set fields: `id`, `title`, `lang` (the tools needed; the only tag shown), `problem`, optional `input`/`output`, `examples` [{i,o,why}], `task`, `constraints`, `starter`, `hints`, `accept`, `stretch`, `builds`.
- Check types: `num` (a, tol, unit), `text` (acc: lowercase accepted answers), `choice` (o, a = index), `explain` (model answer, self-graded).
- `EMBER[weekId]`: `ms` (milestone), `carry`, `unlock`. Refs are `[weekId | "Setup" | "final", text]`.
- `LENSCASE[weekId]`: one real-world scenario traced through think/design/protect/attack/innovate.
- `TESTS[psetId]` (tests.js): in-browser Python tests for pure-logic problems. `stub` (editor starter when the problem has no `starter`), `tests` [{pre, run, want, show, hide}]. A test passes when `eval(run) == eval(want)`. Passing every test ticks Solved. Learner code saves to `S.code`.
- `addBuilds` calls in `snowball.js` set each problem set's `builds` line (how it feeds later sections and Ember). All other content lives in the week files.

## Routing
Hash routes: `#home`, `#setup`, `#w0`…`#w13`, `#final`. Rendering lives in `app3.js`; routing and events live in `app4.js`; the code editor and Pyodide worker live in `ide.js`.

## Content guidelines
- Learners see **sections**, never weeks, and no time estimates: the course sets no pace. Code still calls them weeks (`WEEKS`, ids `w0`…`w13`, routes `#w0`), so URLs and saved progress stay stable.
- Big picture first, then detail. If an idea can't be explained in a few sentences, simplify it.
- No retail framing. Scenarios vary across domains, and Ember is the running project.
- Every attack exercise is lab-only (the learner's own VMs or purpose-built practice platforms) and ends in a detection or a fix.

## Testing
After `python3 build.py`, serve the folder (`python3 -m http.server`) and click through Home, Setup, a few sections and Final. Check that answer checking and the Solved checkboxes update the sidebar counts. On a week with an editor (e.g. `#w0`), Run and Submit a solution and confirm a passing Submit ticks Solved.
