# Nettoplaatje (nettoplaatje.nl)

Free Dutch calculator site: what a job really yields net. It covers:

- bruto-netto, pension and cao terms;
- mobility (lease car, mobility budget, own car);
- travel costs and travel time;
- toeslagen, part-time work and a total job comparison.

This is the reference implementation for the website-builder skills in
`D:\Skills\website-builder` (`tool-site-launch`, `site-hosting`). When you learn
something here that would help the next site, add it to those skills' references too.

## Context

- **Operator:** Monqifyx (KvK 42199903), the user's own brand. Do not publish an address: `OPERATOR.address` in `lib/site.ts` stays empty.
- **Goals, in order:**
  1. a genuinely useful tool;
  2. AdSense revenue;
  3. growing the Monqifyx portfolio;
  4. traffic to Virtrust through labelled house ads (`lib/ads.ts`).

  Results stay neutral, with no Virtrust branding in the tool.
- **The site must earn money, not cost it:** propose free solutions only.
- **Language:** communicate with the user in Dutch. Site copy is Dutch.
- **Advice style:** pragmatic; lead with the common practical option.

## Stack and commands

Next.js 16 static export (`output: "export"`) and React 19 on Cloudflare Workers static assets. No server: all calculations run in the browser.

```bash
npm run dev            # dev server
npm test               # node --test, tests/**/*.test.ts (lib/ imports use .ts)
npm run typecheck
npm run lint
npm run build          # out/ + scripts/flatten-segments.mjs (postbuild)
npm start              # wrangler dev on http://127.0.0.1:3000
npm run deploy         # build + wrangler deploy + IndexNow ping of changed pages
npm run indexnow -- --dry-run   # show which pages IndexNow would submit
npm run build:extension  # Chrome extension -> extension/dist + zip
```

- Preview configs in `.claude/launch.json`: `nettoplaatje-dev`, `nettoplaatje-dev-preview-years` (shows unpublished tax years) and `nettoplaatje-prod`.
- Use 127.0.0.1, not localhost, in the browser pane, curl and seomator.

## Hosting

- **Cloudflare:** Worker `nettoplaatje`, with custom domains for `nettoplaatje.nl` and `www.nettoplaatje.nl` (`wrangler.jsonc`).
- **Security headers:** in `public/_headers`. Framing is allowed only on `/embed/*`.
- **AI crawler policy (Cloudflare):** Search allow, Training disallow, Agents allow. robots.txt contains no AI rules of its own.
- **Contact:** info@nettoplaatje.nl, an alias on the user's Microsoft 365 account.
- **Repo:** github.com/Monqeyking/WerkWaarde. Work happens on `rebuild/nettoplaatje-basis`. `main` was brought level on 20 Nov 2026 (PR #1, fast-forward). Keep it level with a fast-forward, not GitHub's rebase merge, which rewrites the commit IDs. An old Vercel project still deploys `main` to werk-waarde-khaki.vercel.app; the live site is Cloudflare.
- **Indexing:** the site is verified in Search Console as a domain property, with the sitemap submitted. Bing was imported from Search Console.
- **Live check:** run `bash D:/Skills/website-builder/tool-site-launch/scripts/verify-live.sh https://nettoplaatje.nl /embed/bruto-netto`.

## Data and update moments

- **`lib/tax-years.ts`:** tax, toeslagen and combinatiekorting per year.
  - A year with `published: false` is calculated and tested but hidden.
  - 2027 is provisional. Finalise it after the Eerste Kamer vote (15 Dec 2026) against the official Belastingdienst tables, then set `published: true` and review the static "2026" copy.
  - Every Prinsjesdag and 1 January, check against the Belastingdienst.
- **`lib/caos.ts`:** cao terms and pension, with sources and `checkedOn` per entry. Check after new cao agreements and the yearly pension premiums (around December).
- **`lib/articles.ts`:** articles with an `updated` date. Bump it when the content changes.
- **Sources and dates:** every figure needs a source. Look figures up at the source, never from memory.
- **`content-dates.json`:** the date each page's text last changed, used for `<lastmod>` on every sitemap URL. The postbuild (`scripts/content-dates.mjs`) updates it whenever page text changes, so commit it together with that change, also when it changes during `npm run deploy`. Never edit dates by hand, and never reset it: that would make every page look changed today.
- **New calculation year:** bump the extension version (`extension/static/manifest.json`) and rebuild the zip.

## Conventions

- Every page uses `pageMetadata()` from `lib/seo.ts`. A page's own openGraph replaces the layout's.
- Titles are at most 60 characters including " | Nettoplaatje"; otherwise use `title.absolute`. Descriptions are 120–160 characters. Tests check every generated page.
- New logic in `lib/` gets a test. Generated pages (amounts, cao's) need their own numbers and FAQ.
- Ads stay away from inputs, buttons and results, and keep their space reserved. There are no ads in `/embed/*` (`AdSenseHead` skips it).
- Prefill links use the URL fragment, for example `/bruto-netto#bruto=3500&cao=ziekenhuizen`.
- Update the privacy page (and its date) when the site starts processing anything new.
- Make one logical change per commit, with no unrelated work in the same commit.

## Permissions

Ask before push, deploy and any Cloudflare or DNS change. The user approves those per occasion ("Commit en deploy").
