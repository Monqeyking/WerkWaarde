# Nettoplaatje

Gratis, onafhankelijke rekentool die laat zien wat een baan je netto écht oplevert:
salaris, pensioen, mobiliteit (leaseauto, mobiliteitsbudget, eigen auto), reiskosten,
reistijd en werkgerelateerde kosten.

Gebouwd met Next.js (App Router) als statische export en gehost op Cloudflare (Workers
static assets, gratis plan). Alle berekeningen draaien in de browser; er wordt niets op
een server opgeslagen.

## Ontwikkelen

Vereist Node.js 22.18 of nieuwer (voor het direct draaien van TypeScript-tests).

```bash
npm install
npm run dev        # lokale ontwikkelserver op http://localhost:3000
npm test           # unit tests van de rekenlogica (node:test)
npm run lint
npm run typecheck
npm run build      # statische export naar out/
npm start          # serveert out/ lokaal met wrangler
npm run deploy     # build + upload naar Cloudflare (wrangler login nodig)
```

Na de build kopieert `scripts/flatten-segments.mjs` de prefetch-bestanden van Next naar
de platte namen die de client opvraagt. Configuratie staat in `wrangler.jsonc`,
beveiligingsheaders in `public/_headers`.

## Structuur

- `app/` — pagina's en componenten
- `lib/calculator.ts` — bruto-netto, pensioen, leaseauto, mobiliteitsbudget, eigen auto
- `lib/work-costs.ts` — kosten van een werkpatroon (kantoordagen, reizen, opvang)
- `lib/job-model.ts` — gedeeld datamodel `{ huidige baan, nieuwe baan }` dat alle
  calculators en het totaaloverzicht vullen, met opslag in de browser
- `tests/` — unit tests; voeg bij elke wijziging in de rekenlogica een test toe

Imports binnen `lib/` gebruiken de `.ts`-extensie, zodat Node de tests zonder bundler
kan draaien.

## Fiscale tarieven bijwerken

De tarieven staan per jaar in `lib/tax-years.ts` (belasting, heffingskortingen,
toeslagen, combinatiekorting). Een jaar met `published: false` wordt berekend en getest
maar niet getoond. Controleer de tarieven elk jaar rond Prinsjesdag en 1 januari tegen
de bronnen van de Belastingdienst, en werk de tests bij. Cao-gegevens staan in
`lib/caos.ts`, elk met bron en controledatum.

## Omgevingsvariabelen

Zie `.env.example`. Ze worden tijdens de build ingebakken, dus zet ze in `.env.local`
op de machine die `npm run deploy` draait:

- `NEXT_PUBLIC_SITE_URL` — publieke URL, gebruikt voor sitemap en robots
- `NEXT_PUBLIC_CONTACT_EMAIL` — contactadres op privacy- en contactpagina
- `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` — `ca-pub-…`; genereert ook `/ads.txt`
- `NEXT_PUBLIC_ADSENSE_SLOT_CONTENT` — advertentie-unit

## Iconen

`node scripts/build-icons.mjs` tekent `app/apple-icon.png` en `public/icon-192.png` /
`icon-512.png` uit dezelfde vormen als `app/icon.svg`. Alleen opnieuw draaien als het
logo verandert.
