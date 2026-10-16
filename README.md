# Crew Sleep (kkuljam)

A sleep planner for cabin crew, installable on a phone as an app (PWA). It plans
sleep around a rotation so you stay on home time across time zones: when to
sleep on a layover, which bunk break to take, naps, light and caffeine, and the
legal rest between duties. The defaults are set up for Trinity Airways out of
Seoul (ICN / GMP); everything can be changed in the app's configuration.

Everything is stored in the browser (localStorage). There is no server and no
account; use **Download** / **Import** in the configuration to back up a
profile or move it to another device.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ locally
npm run icons      # redraw the app icons into public/
```

| File | What it holds |
|---|---|
| `src/CrewSleep.tsx` | The page |
| `src/crewSleepLogic.ts` | Time zones and the planning rules (no React) |
| `src/crewSleepNetwork.ts` | Airports, routes, block times and flight numbers |
| `vite.config.ts` | Build, app manifest and offline cache |
| `public/_headers` | Cache rules on Cloudflare |
| `wrangler.jsonc` | Cloudflare deploy: serve `dist/` as static files |

## Deploy on Cloudflare

Workers & Pages → Create → import this repository, then:

| Setting | Value |
|---|---|
| Project name | `kkuljam` (must match `name` in `wrangler.jsonc`) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Environment variable | `NODE_VERSION` = `20` |

`wrangler.jsonc` serves `dist/` as static files; `public/_headers` sets the
cache rules. Every push to `main` deploys. Check a build locally with
`npm run build && npx wrangler deploy --dry-run`.

To serve the app under a sub-path instead (e.g. GitHub Pages at `/kkuljam/`),
build with `BASE_PATH=/kkuljam/ npm run build`.

## Install on an iPhone

1. Open the site in **Safari** (other iPhone browsers cannot install apps).
2. Share → **Add to Home Screen**.
3. Open it once while online so it is saved for offline use.

Data entered in Safari is not shared with the installed app: move it with
Download / Import.
