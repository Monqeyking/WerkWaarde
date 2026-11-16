# Nettoplaatje (voorheen WerkWaarde)

Gratis, onafhankelijke rekentool die laat zien wat een baan je netto écht oplevert:
salaris, pensioen, mobiliteit (leaseauto, mobiliteitsbudget, eigen auto), reiskosten,
reistijd en werkgerelateerde kosten.

Gebouwd met Next.js (App Router) en gehost op Vercel. Alle berekeningen draaien in de
browser; er wordt niets op een server opgeslagen.

## Ontwikkelen

Vereist Node.js 22.18 of nieuwer (voor het direct draaien van TypeScript-tests).

```bash
npm install
npm run dev        # lokale ontwikkelserver op http://localhost:3000
npm test           # unit tests van de rekenlogica (node:test)
npm run lint
npm run typecheck
npm run build      # productie-build, zoals Vercel die draait
```

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

De tarieven staan in `lib/calculator.ts`. Controleer ze elk jaar rond Prinsjesdag en
1 januari tegen de bronnen van de Belastingdienst, en werk de tests bij.

## Omgevingsvariabelen

Zie `.env.example`. Stel ze in Vercel in:

- `NEXT_PUBLIC_SITE_URL` — publieke URL, gebruikt voor sitemap en robots
- `NEXT_PUBLIC_CONTACT_EMAIL` — contactadres op privacy- en contactpagina
- `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` — `ca-pub-…`; genereert ook `/ads.txt`
- `NEXT_PUBLIC_ADSENSE_SLOT_CONTENT` — advertentie-unit
