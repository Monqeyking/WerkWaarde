# Ontwerp: deeltijd vs voltijd, met toeslagen

Status: gebouwd (18 november 2026), stappen 1 tot en met 7. Nog open: de bedragen voor 2027
(na de definitieve publicatie) en eventueel de gedetailleerde opvang in `/werkpatroon`.

Afwijking van het ontwerp: de toeslagen zitten in `calculateJobTotal` (veld `allowances`), zodat
het totaaloverzicht en `/deeltijd` met dezelfde berekening werken. `lib/household.ts` levert daarvoor
`allowancesFor`.

## Doel

Laten zien wat een dag meer of minder werken je huishouden **netto** oplevert: na belasting,
na het wegvallen van toeslagen en na extra kosten voor opvang en reizen. Kernuitkomst:
"Van 32 naar 40 uur: € X per maand erbij, dat is Y% van het extra bruto". De rest heet
marginale druk.

Voorbeeld (partners, 1 kind op dagopvang, eigen salaris € 55k voltijd, partner € 40k):
€ 11.000 bruto extra levert € 2.879 op. Dat is een marginale druk van 74%.

## Wat er al is

- `incomeTax` en `calculateJobTotal` rekenen het belastbaar inkomen per baan uit, inclusief
  bijtelling en mobiliteit.
- `salary.hoursPerWeek`, `commute.officeDaysPerWeek`, `job.childcareDaysPerWeek`,
  `personal.childcareCostPerDay` (netto per dag, ná toeslag).
- `caos.ts` kent per cao `fullTimeHours`.
- `amounts.ts` toont al rijen voor 32 en 36 uur, alleen voor belasting.

## Wat er ontbreekt of niet klopt

1. **Huishouden**: geen partner, kinderen of vermogen in het model.
2. **Kinderopvang** wordt als netto bedrag per dag ingevoerd. Zo kun je het effect van het
   toeslagpercentage niet uitrekenen.
3. **Pensioenfranchise** wordt niet naar deeltijd geschaald. In de meeste regelingen (ABP,
   PFZW) is de grondslag (voltijdsalaris − franchise) × deeltijdfactor. Nu rekent de tool bij
   deeltijd te weinig pensioenpremie. Dat speelt dus ook buiten deze feature.
4. `job-total` geeft het belastbaar jaarinkomen niet terug. Dat is nodig voor het
   toetsingsinkomen.

## Rekenmodel

### Toetsingsinkomen (`lib/toeslagen.ts`)

```
toetsingsinkomen = eigen belastbaar box 1-loon (salaris + vakantiegeld + bonus − eigen pensioenpremie
                   + bijtelling / belast mobiliteitsdeel)
                 + belastbaar inkomen partner
                 − aftrekposten (hypotheekrente e.d., één invoerveld)
```

Het eigen deel komt uit `calculateJobTotal`. Voeg daar `taxableAnnual` aan het resultaat
toe. Box 3 laten we weg. Wie veel vermogen heeft, vinkt "vermogen boven de grens" aan en
krijgt dan geen toeslagen.

### Kinderopvangtoeslag

Per kind in opvang:

```
uren/maand  = min(230, opvangdagen/week × uren/dag × opvangweken/jaar / 12)
vergoedbaar = min(werkelijke uurprijs, max uurprijs[soort])
toeslag     = uren × vergoedbaar × pct(toetsingsinkomen, eersteKind?)
netto kosten = uren × werkelijke uurprijs − toeslag
```

- "Eerste kind" is het kind met de meeste opvanguren. De andere kinderen krijgen het
  percentage van de tabel "tweede en volgende".
- Voorwaarde: beide partners werken. Als het partnerinkomen 0 is, is de toeslag 0 en tonen
  we een melding. Uitzonderingen zoals studie of een traject laten we weg.
- Geen koppeling aan gewerkte uren (die is in 2023 vervallen).

### Kindgebonden budget

```
max   = Σ kinderen (basis + toeslag 12–15 of 16–17) + (geen partner ? alleenstaande-ouderkop : 0)
afbouw = rate × max(0, toetsingsinkomen − drempel[partner?])
           (+ rate2 × max(0, toetsingsinkomen − drempel2)  ← alleen als het jaar dat kent, zie 2027)
kgb   = max(0, max − afbouw)
```

De leeftijd telt als leeftijd in het rekenjaar. Wisselingen halverwege het jaar laten we weg.

### Zorgtoeslag

```
normpremie = normRate[partner?] × drempelinkomen + normRateAbove × max(0, ti − drempelinkomen)
zorgtoeslag = max(0, standaardpremie × (partner ? 2 : 1) − normpremie), 0 boven inkomensgrens
```

De parameters bij het bouwen controleren in de Staatscourant (regeling standaardpremie en
normpremie 2026). Ze moeten de tabel van de Belastingdienst reproduceren:

| Situatie, inkomen | Verwacht per maand |
|---|---|
| alleen, € 30.000 | € 126 |
| alleen, € 36.000 | € 57 |
| partners, € 45.000 | € 72 |

### Huurtoeslag

Rekenen we niet uit. Als iemand aangeeft huurtoeslag te krijgen, verwijzen we naar de
proefberekening van de Belastingdienst.

### Uren-scenario's (`lib/part-time.ts`)

Het scenario gaat uit van de gekozen baan (huidig of nieuw), met hetzelfde uurloon:

| Grootheid | Regel in scenario met `h` uur |
|---|---|
| Bruto per maand | `grossMonthly × h / hoursPerWeek` |
| Bonus, 13e maand, vakantiegeld | volgen via percentages; vaste `annualBonus` naar rato |
| Pensioen, modus "regeling" | franchise × `h / fullTimeHours` |
| Pensioen, modus "maandbedrag" | naar rato van `h`. Dat is exact als de franchise naar deeltijd wordt geschaald |
| Werkdagen | `h / 8`, maximaal 5 (bestaande `workingDaysPerWeek`) |
| Kantoordagen | `min(huidige kantoordagen, werkdagen)` |
| Opvangdagen | huidige opvangdagen + (werkdagen − huidige werkdagen), tussen 0 en 5. Uit te zetten met "opvang verandert niet" |
| Partner | ongewijzigd |

De uitkomst per scenario is `{ uren, bruto, nettoloon, toeslagen {kot, kgb, zt},
opvangBruto, opvangNetto, werkkosten, huishoudNetto, nettoPerUur }`. `huishoudNetto` is het
nettoloon plus de toeslagen, min de netto opvangkosten en de werk- en reiskosten (zelfde
posten als in `job-total`). Het inkomen van de partner telt niet mee, want dat is gelijk in
alle scenario's.

Marginale druk tussen scenario A en B: `1 − Δ huishoudNetto / Δ bruto (incl. vakantiegeld)`.

Staffel: 60%, 70%, 80%, 90% en 100% van de voltijduren. Bij 40 uur is dat 24, 28, 32, 36
en 40. Bij een cao met 36 uur is dat 21,6 tot 36 uur. Die waarden ronden we af op hele
uren.

## Datamodel

Alles toevoegen met standaardwaarden. Dankzij `overlay` blijven oude opslag en gedeelde
links werken, zonder nieuwe `MODEL_VERSION`.

```ts
// JobProfile.salary
fullTimeHours: number;            // standaard 40; ingevuld vanuit cao.fullTimeHours

// PersonalSettings
household: {
  enabled: boolean;               // "toeslagen meerekenen"; uit = huidig gedrag
  hasPartner: boolean;
  partnerTaxableAnnual: number;
  deductionsAnnual: number;       // hypotheekrente e.d.
  assetsAboveLimit: boolean;
  receivesRentAllowance: boolean; // alleen voor de verwijzing
  children: { c1: Child; c2: Child; c3: Child; c4: Child };
};
type Child = {
  active: boolean;
  age: number;
  care: "none" | "dagopvang" | "bso" | "gastouder";
  hoursPerDay: number;
  hourlyPrice: number;            // werkelijke uurprijs
  weeksPerYear: number;           // standaard 52
};
```

- **Vaste slots in plaats van een array**: `overlay` en `diff` ondersteunen geen arrays. Met
  vier slots hoeft daar niets aan te veranderen. Meer dan vier kinderen is zeldzaam genoeg.
- **Opvangdagen** blijven per baan (`job.childcareDaysPerWeek`) en gelden voor elk kind in
  opvang.
- Staat `household.enabled` aan en zit er minstens één kind in opvang? Dan vervangt de
  gedetailleerde berekening `personal.childcareCostPerDay`. Staat het uit, dan blijft het
  oude veld werken.
- `sanitizeState`: `care` moet een geldige waarde hebben en de leeftijd moet onder de 18
  blijven.

## Parameters per jaar (`tax-years.ts`)

```ts
toeslagen: {
  assetLimit: { single: number; partner: number };
  kot: {
    maxHourly: { dagopvang: number; bso: number; gastouder: number };
    maxHoursPerMonth: number;
    table: Array<{ from: number; first: number; next: number }>;  // letterlijk uit de tabel
  };
  kgb: {
    perChild: number; age12: number; age16: number; singleParent: number;
    thresholdSingle: number; thresholdPartner: number; rate: number;
    second?: { from: number; rate: number };   // voor de 2027-wetswijziging, als die doorgaat
  };
  zorg: {
    standardPremium: number; thresholdIncome: number;
    normRateSingle: number; normRatePartner: number; normRateAbove: number;
    incomeLimitSingle: number; incomeLimitPartner: number;
  };
}
```

**2026**, gecontroleerd:

- Kinderopvangtoeslag
  - Maximale uurprijs: dagopvang € 11,23, bso € 9,98, gastouder € 8,49.
  - 230 uur per maand.
  - Tabel van Rijksoverheid: 96% tot € 56.412, daarna aflopend tot 36,5% (eerste kind) en
    68,2% (volgende kinderen).
- Kindgebonden budget
  - € 2.580 per kind, plus € 724 (12–15 jaar) of € 964 (16–17 jaar).
  - Alleenstaande-ouderkop: € 3.416.
  - Drempel: € 29.736 alleen, € 39.141 met partner. Afbouw 7,60%.
- Vermogensgrens: € 146.011 alleen, € 184.633 met partner.
- Zorgtoeslag
  - Maximaal € 129 per maand alleen, € 246 met partner.
  - Grens rond € 41.000 alleen en € 51.500 met partner.
  - Formuleparameters nog verifiëren (zie hierboven).

**2027** (`published: false`) staat nog open:

- Tabel kinderopvangtoeslag: wijzigingsbesluit Prinsjesdag, met een vaste voet van 39,1% voor
  het eerste kind.
- Tweede afbouw kindgebonden budget vanaf € 60k: wetsvoorstel nog in behandeling.
- Zorgtoeslag: de ramingen uit de Miljoenennota.

Vullen nadat de bedragen definitief zijn, op dezelfde manier als de belastingtarieven van
2027.

## Pagina `/deeltijd`

SpokePage, kicker "Deeltijd of voltijd", titel "Wat levert een dag extra werken op?".

**Invoer** (links):

1. JobToggle: welke baan.
2. Salaris: bruto per maand, uren per week, voltijduren (met CaoSelect).
3. Werk: kantoordagen, opvangdagen nu, vinkje "opvang verandert mee met werkdagen".
4. Blok "Toeslagen meerekenen", standaard dicht:
   - partner ja of nee, met belastbaar inkomen van de partner;
   - kinderen: maximaal 4, elk met leeftijd, soort opvang, uren per dag en uurprijs;
   - aftrekposten;
   - vermogen boven de grens;
   - "ik krijg huurtoeslag" (geeft een melding met verwijzing).

**Uitkomst** (rechts):

1. Highlight: "Van {A} naar {B} uur: € X per maand erbij". Daaronder "Van elke extra euro
   bruto houd je Y cent over". A en B zijn de huidige uren en de naastgelegen staffelstap,
   en zijn te wijzigen.
2. Waterval van A naar B: extra bruto → belasting → minder kindgebonden budget en
   zorgtoeslag → lagere opvangtoeslag en extra opvang → extra reiskosten → wat overblijft.
   Dit is de uitleg in één beeld.
3. Tabel met de staffel: uren, bruto, nettoloon, toeslagen, netto opvang, werkkosten,
   **huishoudnetto**, netto per uur (inclusief reistijd).
4. Melding over het grootste effect, bijvoorbeeld "Het grootste deel verdwijnt door een
   lagere kinderopvangtoeslag".
5. Knop "Naar totaaloverzicht".

**SEO en inhoud**

- FAQ:
  - Loont 4 dagen werken?
  - Wat kost een dag minder werken?
  - Wat is marginale druk?
  - Telt mijn leaseauto mee voor toeslagen? (ja, de bijtelling verhoogt je toetsingsinkomen)
- Artikelen: `marginale-druk`, `kinderopvangtoeslag-2026`, `kindgebonden-budget-2026`.
- Later eventueel programmatische pagina's `/deeltijd/[bedrag]`, naar het voorbeeld van
  `/bruto-netto/[bedrag]`.

**Elders bijwerken**

- `calculators.ts`, de sitemap en de navigatie.
- Disclaimers: "geen toeslagen" wordt "zorgtoeslag, kindgebonden budget en
  kinderopvangtoeslag indicatief; geen huurtoeslag". Daarbij een link naar de
  proefberekening van de Belastingdienst.
- Hint bij `childcareCostPerDay`: verwijzen naar het nieuwe blok.

## Totaaloverzicht (fase 2)

Als `household.enabled` aan staat, krijgt `/totaal` een extra rij "Toeslagen" en wordt de
opvang de netto opvang uit de nieuwe berekening. Een nieuwe baan met leaseauto kan dan
zichtbaar toeslag kosten.

## Tests

- **Kinderopvangtoeslag**: grenzen van de tabel (€ 56.412 en € 56.413), maximale uurprijs,
  230 uur, keuze van het eerste kind, partner zonder inkomen.
- **Kindgebonden budget**: de vier AFAS-voorbeelden en de alleenstaande-ouderkop.
- **Zorgtoeslag**: de drie tabelwaarden hierboven, met maximaal € 1 verschil.
- **Toetsingsinkomen**: bijtelling verhoogt het, aftrekposten verlagen het.
- **Pensioen**: franchise naar deeltijd. 32 uur in modus "regeling" geeft 80% van de premie
  bij voltijd.
- **Scenario's**: bruto stijgt met de uren; als toeslagen uit staan, komt de uitkomst
  overeen met `grossToNet`.
- **Model**: oude opslag zonder `household` laadt goed; ongeldige `care` valt terug op een
  geldige waarde.

## Bouwvolgorde

1. Parameters in `tax-years.ts` en `lib/toeslagen.ts`, met tests.
2. `fullTimeHours` en pensioenfranchise naar deeltijd, met tests. Dit verandert ook
   bestaande uitkomsten voor deeltijders.
3. Huishoudblok in `job-model.ts`, met sanitize en tests.
4. `lib/part-time.ts`, met tests.
5. Pagina `/deeltijd`, de UI-componenten en de waterval.
6. Disclaimers, FAQ, artikelen, sitemap en navigatie.
7. Het totaaloverzicht koppelen.

## Open keuzes

- Partneruren ook variabel maken (bijvoorbeeld "wie gaat minder werken")? Voorstel: niet in
  v1.
- Opvangdagen per kind in plaats van per huishouden? Voorstel: niet in v1.
- De gedetailleerde opvangberekening ook in `/werkpatroon` gebruiken? Voorstel: ja, in fase 2.
