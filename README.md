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
| `public/_headers` | Cache rules for Cloudflare Pages |

## Deploy on Cloudflare Pages

Workers & Pages → Create → Pages → connect this repository, then:

| Setting | Value |
|---|---|
| Framework preset | None (or Vite) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variable | `NODE_VERSION` = `20` |

Every push to `main` deploys; other branches get preview URLs. The app is
served from the root of its domain. To serve it under a sub-path instead (e.g.
GitHub Pages at `/kkuljam/`), build with `BASE_PATH=/kkuljam/ npm run build`.

## Install on an iPhone

1. Open the site in **Safari** (other iPhone browsers cannot install apps).
2. Share → **Add to Home Screen**.
3. Open it once while online so it is saved for offline use.

Data entered in Safari is not shared with the installed app: move it with
Download / Import.
