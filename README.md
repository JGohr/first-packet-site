# First Packet

A first-principles, CS50-style course on networking and compute. Over 14 weeks you build **Ember**, a messaging platform, from a single chat server into an encrypted, load-balanced, monitored and hardened system, then ship it as your final project.

- Landing page, a lab setup guide, and one study page per week
- One diagram per week
- LeetCode-style problem sets (44)
- Self-graded checks (64)
- Progress saved in the browser (`localStorage`)

## Run locally

```bash
python3 build.py              # assembles src/ into index.html
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages → Build and deployment**, set the source to **Deploy from a branch**, and pick `main` with the `/ (root)` folder.
3. The site appears at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

`index.html` is committed, so Pages serves it as is and no build step runs on GitHub. Run `python3 build.py` after every edit to `src/` and commit both.

## Project layout

| Path | What it holds |
| --- | --- |
| `src/shell.html` | Page skeleton: top bar, landing sections, workspace layout |
| `src/style.css` | Notion-inspired dark theme (all colors are tokens on `:root`) |
| `src/weeks_a.js`, `src/weeks_b.js` | Course content for weeks 0–6 and 7–13, plus the final project |
| `src/snowball.js` | Ember milestones, carry-in/unlocks, the five-lens case per week, content overrides |
| `src/setup.js` | Lab setup steps and the verification checklist |
| `src/diagrams.js` | One inline SVG diagram per week |
| `src/app1.js`–`app4.js` | Renderer: state, problems and checks, pages, routing and interactions |
| `build.py` | Concatenates everything into `index.html` |
