# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, Cursor, ...) working on
this repository. People: see `README.md`.

Kkuljam (꿀잠) is a sleep planner for cabin crew that installs as a web app
(PWA): it plans sleep around a rotation to stay on home time. It is a static
site on Cloudflare; all data lives in the user's browser.

## Who asks for changes

Changes are often requested by people who use the app but do not write code.
Describe what you changed in plain words (what they will see, not which files),
and ask before making a large or risky change they may not expect.

## How to ship a change

1. Work on a new branch. **Never push to `main`**: every push to `main` deploys
   to the live site on Cloudflare.
2. Run the checks below; they must pass before you push.
3. Push the branch and open a pull request that says, in plain words, what
   changed and how to try it.
4. Cloudflare builds every branch other than `main` as a preview and comments
   the preview link on the pull request. Point the requester to that link so
   they can try the change on their phone.
5. The pull request is merged into `main` once the change looks right on the
   preview; that deploys it.

The preview is a separate site, so it starts with **no data**. To test with
real data: **Download** a backup on the live app, then **Import** it on the
preview. Nothing done on a preview touches the live app or its data.

## Checks

```sh
npm install
npm run build      # type-check + production build; must pass
```

There are no automated tests: also run `npm run dev` and try the change.
Planning rules live in `src/crewSleepLogic.ts` (no React); keep them there.

## Users' data: do not lose it

Profiles exist only in each user's browser (localStorage). A change to how
they are stored can silently wipe everyone's data, so:

- Keys: `crew-sleep:profiles` (saved profiles by name) and `crew-sleep:draft`
  (the unsaved one). See the end of `src/crewSleepLogic.ts`. The key prefix
  stays `crew-sleep` even though the app is now called Kkuljam.
- Do not rename keys or change the shape of a profile without code that reads
  the old form and converts it (`normalizeProfile` fills in missing fields:
  add new fields there with a default).
- Backups (`{ app: 'crew-sleep', version: 1, name, savedAt, profile }`) must
  keep importing. If the format must change, bump `version` and keep reading
  the old one.

## Keep it an offline web app

- There is no server, no account and no analytics. Do not add any: no
  backend, no external API calls carrying user data, no trackers.
- Everything the app needs must keep working offline after the first visit.
  The app manifest and offline cache are in `vite.config.ts`; `public/_headers`
  makes new deploys reach installed phones.
- Phones first: check layouts at 390 px wide, and keep content clear of the
  notch (`env(safe-area-inset-*)` in `src/index.css`). iPhone Safari is the
  strictest browser to support.
- Colours come from the tokens in `src/theme.css`, which has light and dark
  values; do not hard-code colours that break dark mode.
- Match the surrounding code: React 19, Chakra UI v3, `lucide-react` icons,
  hash routes (`#/...`).
- Update `README.md` when what it says changes.
- Never commit `dist/`, `node_modules/`, `.wrangler/` or secrets.
