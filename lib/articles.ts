export type ArticleSection = { heading: string; paragraphs: string[] };
export type Article = {
  slug: string; // kebab-case, Dutch, e.g. "wat-is-bijtelling"
  title: string; // the H1, a question or clear statement, ≤ 70 chars
  seoTitle?: string; // shorter <title> when title plus " | Nettoplaatje" would exceed 60 chars
  description: string; // meta description, 120–155 chars, no quotes
  updated: string; // "2026-11-16"
  intro: string; // 2–3 sentences answering the question directly (featured-snippet style)
  sections: ArticleSection[]; // 3–5 sections, each 1–3 paragraphs
  calculator: { href: string; label: string }; // primary call to action, label like "Bereken je bijtelling"
  related: string[]; // 2–3 slugs of other articles in this file
};

export const ARTICLES: Article[] = [
  {
    slug: "banen-eerlijk-vergelijken",
    title: "Hoe vergelijk je twee banen eerlijk?",
    description:
      "Een hoger brutosalaris zegt niet alles. Zo vergelijk je twee banen op netto na kosten, reistijd, pensioen en vakantiedagen.",
    updated: "2026-11-16",
    intro:
      "Je vergelijkt twee banen eerlijk door te kijken naar wat je netto overhoudt na de kosten van werken, en niet alleen naar het brutosalaris. Tel daarbij ook je reistijd, de pensioenregeling en het aantal vakantiedagen mee. Pas dan zie je welke baan je per saldo meer oplevert.",
    sections: [
      {
        heading: "Kijk naar netto, niet naar bruto",
        paragraphs: [
          "Een vacature noemt bijna altijd een brutosalaris per maand. Maar wat op je rekening komt, is het nettobedrag. Daarnaast verschillen banen in vakantiegeld, een eventuele 13e maand en een bonus. Vakantiegeld is wettelijk minimaal 8% van je brutosalaris. Een 13e maand is 8,33% van je jaarsalaris. Twee banen met hetzelfde maandsalaris kunnen per jaar dus flink uiteenlopen.",
          "Let ook op hoe belasting werkt bij hogere bedragen. Bij middeninkomens houd je van elke extra euro bruto vaak maar ongeveer de helft over. Een verschil van € 300 bruto per maand is netto dus veel kleiner. Hoe dat precies werkt, lees je in [bruto naar netto: hoe werkt dat?](/vragen/bruto-naar-netto).",
        ],
      },
      {
        heading: "Trek de kosten van werken eraf",
        paragraphs: [
          "Werken kost geld. Denk aan brandstof, parkeren, slijtage van je auto of een ov-abonnement. Krijg je een kilometervergoeding, dan dekt die niet altijd je echte autokosten. Krijg je een leaseauto, dan betaal je belasting over de bijtelling en soms een eigen bijdrage. Die kosten verschillen per baan en per afstand.",
          "Trek deze kosten af van je netto inkomen. Zo krijg je het bedrag dat je echt overhoudt. Een baan die bruto meer betaalt maar verder weg ligt, kan na kosten minder opleveren. Meer over een auto van de zaak lees je in [wat is bijtelling?](/vragen/wat-is-bijtelling).",
        ],
      },
      {
        heading: "Reken je reistijd mee",
        paragraphs: [
          "Reistijd is tijd die je kwijt bent voor je werk, maar waarvoor je meestal niet betaald krijgt. Een uur per dag extra reizen is bij een volle werkweek al gauw vijf uur per week. Door je netto inkomen te delen door je werkuren plus je reistijd, krijg je je netto uurloon inclusief reistijd. Dat getal maakt banen met verschillende reisafstanden beter vergelijkbaar. Een uitgewerkt voorbeeld staat in [telt reistijd mee?](/vragen/reistijd-meetellen-nieuwe-baan).",
        ],
      },
      {
        heading: "Pensioen en vakantiedagen",
        paragraphs: [
          "De pensioenpremie die je werkgever betaalt, zie je niet terug in je netto loon. Toch is het wel een deel van je totale beloning. Een werkgever die meer pensioenpremie betaalt, geeft je in feite meer, ook al merk je dat pas later.",
          "Ook vakantiedagen hebben waarde. Wettelijk heb je recht op minimaal vier keer het aantal dagen dat je per week werkt. Bij een volle werkweek van vijf dagen is dat 20 dagen. Biedt een baan 25 dagen, dan heb je vijf vrije dagen extra. Elke extra vrije dag is ongeveer een dagloon waard.",
        ],
      },
      {
        heading: "Zo maak je de vergelijking",
        paragraphs: [
          "Zet beide banen naast elkaar en vul per baan het salaris, de extra's, je reisafstand en je vervoer in. Met de rekenhulp van Nettoplaatje zie je in één overzicht wat elke baan netto oplevert na kosten, en wat je per uur overhoudt inclusief reistijd. De uitkomst is een indicatie op basis van de belastingregels van 2026. Jouw persoonlijke situatie kan afwijken.",
        ],
      },
    ],
    calculator: { href: "/totaal", label: "Vergelijk twee banen" },
    related: [
      "bruto-naar-netto",
      "reistijd-meetellen-nieuwe-baan",
      "waarde-pensioen-en-arbeidsvoorwaarden",
    ],
  },
  {
    slug: "bruto-naar-netto",
    title: "Bruto naar netto: hoe werkt dat?",
    description:
      "Van bruto naar netto in stappen: belastingschijven, heffingskortingen en pensioenpremie. Met een rekenvoorbeeld op basis van de regels van 2026.",
    updated: "2026-11-16",
    intro:
      "Je nettoloon is je brutoloon min je eigen pensioenpremie en min de loonheffing. De loonheffing bereken je met belastingschijven, en daarna gaan de heffingskortingen eraf. Hoe hoger je inkomen, hoe kleiner die kortingen worden.",
    sections: [
      {
        heading: "Stap 1: pensioenpremie gaat eraf vóór de belasting",
        paragraphs: [
          "Bij de meeste werkgevers betaal je zelf een deel van de pensioenpremie. Dat bedrag gaat van je brutoloon af voordat de belasting wordt berekend. Je betaalt over dat deel dus geen loonheffing.",
          "Daardoor kost pensioenpremie je netto minder dan het brutobedrag. Betaal je € 200 per maand eigen pensioenpremie en zit je in de inkomensgroep waar je marginale tarief rond de 50% ligt, dan gaat je netto loon ongeveer € 100 omlaag.",
        ],
      },
      {
        heading: "Stap 2: belasting per schijf",
        paragraphs: [
          "Over je belastbaar inkomen betaal je belasting in schijven. In 2026 gelden onder de AOW-leeftijd deze tarieven: 35,75% tot € 38.883, 37,56% van € 38.883 tot € 78.426, en 49,5% over alles daarboven.",
          "Het hogere tarief geldt alleen voor het deel van je inkomen dat in die schijf valt. Ga je net over een grens heen, dan betaal je dus niet ineens over je hele inkomen meer belasting.",
        ],
      },
      {
        heading: "Stap 3: heffingskortingen gaan eraf",
        paragraphs: [
          "Van de belasting gaan twee kortingen af. De algemene heffingskorting is maximaal € 3.115. Vanaf € 29.736 inkomen wordt die korting kleiner, met 6,398% van elke euro boven die grens. De arbeidskorting is maximaal € 5.685. Vanaf € 45.592 wordt die kleiner, met 6,51% van elke euro daarboven.",
          "Doordat de kortingen afnemen, stijgt je belasting sneller dan het tarief doet vermoeden. Daarom houd je bij middeninkomens van een loonsverhoging vaak maar ongeveer de helft over. Dat lees je in [hoeveel bruto heb je nodig voor € 100 netto meer?](/vragen/bruto-voor-100-euro-netto-meer).",
        ],
      },
      {
        heading: "Een vereenvoudigd rekenvoorbeeld",
        paragraphs: [
          "Neem een jaarinkomen van € 48.000 bruto, zonder pensioenpremie. Over de eerste € 38.883 betaal je 35,75%, dat is ongeveer € 13.901. Over de overige € 9.117 betaal je 37,56%, dat is ongeveer € 3.424. Samen is dat ongeveer € 17.325.",
          "De algemene heffingskorting is bij dit inkomen nog ongeveer € 1.946. De arbeidskorting is nog ongeveer € 5.528. Je betaalt dan ongeveer € 9.851 belasting en houdt ongeveer € 38.149 per jaar over. In de praktijk houdt je werkgever elke maand loonheffing in via tabellen, en wordt het verschil verrekend via je aangifte.",
        ],
      },
      {
        heading: "Bereken je eigen nettoloon",
        paragraphs: [
          "Je eigen situatie hangt af van je salaris, je pensioenpremie, je vakantiegeld en eventuele extra's. De rekenhulp van Nettoplaatje rekent met de tarieven en kortingen van 2026 en geeft een goede indicatie. Je echte loonstrook kan afwijken, bijvoorbeeld door andere inhoudingen of persoonlijke omstandigheden. Hoe de berekening werkt, staat in de [uitleg van de rekenmethode](/uitleg).",
        ],
      },
    ],
    calculator: { href: "/bruto-netto", label: "Bereken je nettoloon" },
    related: [
      "bruto-voor-100-euro-netto-meer",
      "minder-over-van-vakantiegeld-en-bonus",
      "banen-eerlijk-vergelijken",
    ],
  },
  {
    slug: "minder-over-van-vakantiegeld-en-bonus",
    title: "Waarom houd je minder over van je vakantiegeld, 13e maand of bonus?",
    seoTitle: "Vakantiegeld en bonus: waarom minder netto?",
    description:
      "Van vakantiegeld, een 13e maand of bonus blijft vaak maar de helft over. Lees hoe het bijzonder tarief en het afbouwen van heffingskortingen werken.",
    updated: "2026-11-16",
    intro:
      "Vakantiegeld, een 13e maand en een bonus komen bovenop je gewone salaris. Ze worden daarom belast tegen je marginale tarief: het tarief over je laatst verdiende euro's. Bij middeninkomens ligt dat rond de 50%, omdat naast de belasting ook je heffingskortingen afnemen.",
    sections: [
      {
        heading: "Wat is het bijzonder tarief?",
        paragraphs: [
          "Over je gewone maandloon houdt je werkgever loonheffing in via de normale tabel. Voor extra betalingen zoals vakantiegeld, een 13e maand of een bonus gebruikt je werkgever een aparte tabel: de tabel voor bijzondere beloningen. Het percentage daarin noemen we het bijzonder tarief.",
          "Dat tarief hangt af van je jaarloon. Het is geen extra belasting. Het is een manier om alvast de belasting in te houden die je over dat extra bedrag verschuldigd bent. Wijkt het ingehouden bedrag af van wat je echt moet betalen, dan kan dat worden rechtgezet via je aangifte inkomstenbelasting.",
        ],
      },
      {
        heading: "Waarom het percentage zo hoog is",
        paragraphs: [
          "Een extra betaling komt boven op je gewone inkomen. Je betaalt er dus het tarief over van de schijf waar je al in zit. Tussen € 38.883 en € 78.426 is dat 37,56%. Maar in dat gebied worden ook je heffingskortingen kleiner. De algemene heffingskorting daalt met 6,398% van elke extra euro. Vanaf € 45.592 daalt ook de arbeidskorting, met 6,51% van elke extra euro.",
          "Tel je dat bij elkaar op, dan kom je tussen ongeveer € 45.600 en € 78.400 uit op een marginaal tarief van ongeveer 50%. Van elke extra euro bruto houd je dan dus ongeveer de helft over. Meer over dit effect lees je in [hoeveel bruto heb je nodig voor € 100 netto meer?](/vragen/bruto-voor-100-euro-netto-meer).",
        ],
      },
      {
        heading: "Rekenvoorbeeld met vakantiegeld en 13e maand",
        paragraphs: [
          "Stel, je verdient € 4.000 bruto per maand. Dat is € 48.000 per jaar. Je vakantiegeld is 8% daarvan: € 3.840 bruto. Met dat vakantiegeld erbij kom je op € 51.840 en zit je in het gebied met een marginaal tarief van ongeveer 50%. Van je vakantiegeld houd je dan ongeveer € 1.900 netto over.",
          "Krijg je ook een 13e maand, dan is dat 8,33% van je jaarsalaris, ongeveer € 4.000 bruto. Ook daarvan blijft ongeveer de helft over, dus rond de € 2.000 netto. Voor een bonus geldt hetzelfde.",
        ],
      },
      {
        heading: "Wat betekent dit als je banen vergelijkt?",
        paragraphs: [
          "Een baan met een 13e maand of een vaste bonus levert per jaar meer op dan het maandsalaris doet vermoeden. Maar reken altijd met het nettobedrag, niet met het brutobedrag. Een bonus die niet gegarandeerd is, kun je beter apart bekijken. In [twee banen eerlijk vergelijken](/vragen/banen-eerlijk-vergelijken) lees je hoe je alle onderdelen naast elkaar zet.",
          "Wil je weten wat je van je eigen vakantiegeld of bonus overhoudt? Vul je salaris en extra's in bij de rekenhulp. De uitkomst is een indicatie op basis van de regels van 2026. De precieze inhouding op je loonstrook kan afwijken.",
        ],
      },
    ],
    calculator: { href: "/bruto-netto", label: "Bereken je netto vakantiegeld" },
    related: [
      "bruto-naar-netto",
      "bruto-voor-100-euro-netto-meer",
      "waarde-pensioen-en-arbeidsvoorwaarden",
    ],
  },
  {
    slug: "bruto-voor-100-euro-netto-meer",
    title: "Hoeveel bruto heb je nodig voor € 100 netto meer?",
    seoTitle: "Hoeveel bruto voor € 100 netto meer?",
    description:
      "Bij een middeninkomen heb je vaak ongeveer € 200 bruto nodig voor € 100 netto meer. Lees waarom het marginale tarief rond de 50% ligt en wat dat betekent.",
    updated: "2026-11-16",
    intro:
      "Bij een middeninkomen heb je vaak ongeveer € 200 bruto per maand extra nodig om € 100 netto meer over te houden. Dat komt door je marginale tarief: de belasting over je laatst verdiende euro. Tussen ongeveer € 45.600 en € 78.400 per jaar ligt dat rond de 50%.",
    sections: [
      {
        heading: "Wat is het marginale tarief?",
        paragraphs: [
          "Het marginale tarief is het deel van een extra euro bruto dat naar belasting gaat. Het is iets anders dan het gemiddelde percentage dat je over je hele inkomen betaalt. Dat gemiddelde is lager, omdat je eerste euro's in een lagere schijf vallen en omdat je heffingskortingen krijgt.",
          "Voor een loonsverhoging is juist het marginale tarief belangrijk. Die extra euro's komen namelijk bovenop wat je al verdient.",
        ],
      },
      {
        heading: "Waarom het rond de 50% ligt",
        paragraphs: [
          "In 2026 is het tarief tussen € 38.883 en € 78.426 37,56%. Maar in dat gebied worden ook twee heffingskortingen kleiner. De algemene heffingskorting daalt met 6,398% van elke euro boven € 29.736. De arbeidskorting daalt met 6,51% van elke euro boven € 45.592.",
          "Tussen € 38.883 en € 45.592 groeit de arbeidskorting nog een klein beetje mee, zodat je marginale tarief daar ongeveer 42% is. Tussen € 45.592 en € 78.426 komen alle drie de effecten samen: 37,56% plus 6,398% plus 6,51%. Dat is ongeveer 50%. Boven € 78.426 geldt het toptarief van 49,5% en kan de arbeidskorting nog verder afnemen. Meer over de opbouw lees je in [bruto naar netto: hoe werkt dat?](/vragen/bruto-naar-netto).",
        ],
      },
      {
        heading: "Rekenvoorbeeld",
        paragraphs: [
          "Stel, je verdient € 4.000 bruto per maand en je krijgt er € 200 bij. Je jaarinkomen ligt dan in het gebied waar je marginale tarief ongeveer 50% is. Van die € 200 houd je dan ongeveer € 100 netto over. Per jaar is dat € 2.400 bruto extra en ongeveer € 1.200 netto.",
          "Krijg je vakantiegeld over je salaris, dan stijgt dat mee. Ook die extra euro's worden tegen ongeveer hetzelfde tarief belast. Dat werkt hetzelfde als bij een 13e maand of bonus, zoals je leest in [waarom je minder overhoudt van je vakantiegeld](/vragen/minder-over-van-vakantiegeld-en-bonus).",
        ],
      },
      {
        heading: "Wat betekent dit bij een nieuwe baan?",
        paragraphs: [
          "Biedt een nieuwe werkgever € 300 bruto per maand meer, dan is dat bij een middeninkomen netto ongeveer € 150. Moet je voor die baan verder reizen, dan kunnen hogere reiskosten een groot deel daarvan opeten. Ook een lagere pensioenbijdrage van de werkgever of minder vakantiedagen kunnen het verschil kleiner maken.",
          "Wil je precies zien wat een loonsverhoging netto oplevert? Reken je huidige en je nieuwe salaris door in de rekenhulp. De uitkomst is een indicatie op basis van de regels van 2026. Persoonlijke zaken zoals toeslagen of andere inkomsten kunnen de uitkomst veranderen.",
        ],
      },
    ],
    calculator: { href: "/bruto-netto", label: "Bereken wat je netto overhoudt" },
    related: [
      "bruto-naar-netto",
      "minder-over-van-vakantiegeld-en-bonus",
      "banen-eerlijk-vergelijken",
    ],
  },
  {
    slug: "wat-is-bijtelling",
    title: "Wat is bijtelling en wat kost een leaseauto netto?",
    seoTitle: "Wat is bijtelling en hoe werkt het?",
    description:
      "Bijtelling is een bedrag waarover je belasting betaalt als je een auto van de zaak privé gebruikt. Zo bereken je wat een leaseauto je netto kost in 2026.",
    updated: "2026-11-16",
    intro:
      "Bijtelling is een bedrag dat bij je inkomen wordt opgeteld als je een auto van de zaak ook privé gebruikt. Je betaalt de bijtelling zelf niet, maar je betaalt wel belasting over dat bedrag. In 2026 is de bijtelling meestal 22% van de cataloguswaarde per jaar.",
    sections: [
      {
        heading: "Hoe wordt de bijtelling berekend?",
        paragraphs: [
          "De bijtelling is een percentage van de cataloguswaarde van de auto. Dat is de nieuwprijs inclusief btw en bpm. Het standaardpercentage in 2026 is 22%. Voor volledig elektrische auto's geldt 18% over de eerste € 30.000 van de cataloguswaarde en 22% over de rest.",
          "Betaal je zelf een eigen bijdrage aan je werkgever voor het privégebruik, dan gaat die van de bijtelling af. Voor auto's die in eerdere jaren op kenteken zijn gezet, kan een ander percentage gelden. De precieze regels daarover staan op de website van de Belastingdienst.",
        ],
      },
      {
        heading: "Wat kost de bijtelling je netto?",
        paragraphs: [
          "Je betaalt belasting over de bijtelling tegen je marginale tarief. Bij een middeninkomen ligt dat rond de 50%, omdat ook je heffingskortingen afnemen. Hoe dat werkt, lees je in [hoeveel bruto heb je nodig voor € 100 netto meer?](/vragen/bruto-voor-100-euro-netto-meer).",
          "Neem een auto op benzine met een cataloguswaarde van € 40.000. De bijtelling is 22%, dus € 8.800 per jaar. Bij een marginaal tarief van ongeveer 50% betaal je daarover ongeveer € 4.400 belasting. Dat is ongeveer € 367 per maand minder netto loon.",
        ],
      },
      {
        heading: "Rekenvoorbeeld met een elektrische auto",
        paragraphs: [
          "Neem nu een volledig elektrische auto van € 40.000. Over de eerste € 30.000 geldt 18%, dat is € 5.400. Over de overige € 10.000 geldt 22%, dat is € 2.200. De bijtelling is samen € 7.600 per jaar. Bij ongeveer 50% betaal je daarover ongeveer € 3.800 belasting, of ongeveer € 317 per maand.",
          "Vraagt je werkgever een eigen bijdrage van € 100 per maand, dan gaat er € 1.200 per jaar van de bijtelling af. De bijtelling wordt dan € 6.400 en de belasting daarover ongeveer € 3.200. Maar die € 1.200 eigen bijdrage betaal je zelf. In totaal kost de auto je dan ongeveer € 4.400 per jaar.",
        ],
      },
      {
        heading: "Waar staat de bijtelling tegenover?",
        paragraphs: [
          "Een leaseauto kost je netto geld, maar je krijgt er ook veel voor terug. Vaak zijn brandstof of laden, verzekering, onderhoud en banden inbegrepen. Rijd je veel privé, dan kan dat een groot voordeel zijn. Rijd je weinig, dan betaal je mogelijk belasting voor een auto die je nauwelijks gebruikt. Een vergelijking met een mobiliteitsbudget of je eigen auto vind je in [leaseauto of mobiliteitsbudget](/vragen/leaseauto-of-mobiliteitsbudget).",
          "Met de bijtellingscalculator van Nettoplaatje vul je de cataloguswaarde, het type auto en je salaris in. Je ziet dan wat de auto je netto per maand kost. De uitkomst is een indicatie op basis van de regels van 2026.",
        ],
      },
    ],
    calculator: { href: "/bijtelling", label: "Bereken je bijtelling" },
    related: [
      "leaseauto-of-mobiliteitsbudget",
      "kilometervergoeding-onbelast",
      "bruto-voor-100-euro-netto-meer",
    ],
  },
  {
    slug: "leaseauto-of-mobiliteitsbudget",
    title: "Leaseauto of mobiliteitsbudget: wat levert meer op?",
    seoTitle: "Leaseauto of mobiliteitsbudget: wat is beter?",
    description:
      "Leaseauto, mobiliteitsbudget of je eigen auto met kilometervergoeding? Zo vergelijk je wat elke keuze je netto oplevert of kost, met rekenvoorbeelden.",
    updated: "2026-11-16",
    intro:
      "Of een leaseauto of een mobiliteitsbudget meer oplevert, hangt af van hoeveel je rijdt, welke auto je wilt en wat je zelf al hebt. Een leaseauto kost je belasting over de bijtelling, maar bijna alle autokosten zijn gedekt. Een mobiliteitsbudget krijg je meestal als bruto bedrag, waarvan je zelf je vervoer betaalt.",
    sections: [
      {
        heading: "Wat is een mobiliteitsbudget?",
        paragraphs: [
          "Een mobiliteitsbudget is een vast bedrag dat je werkgever je geeft in plaats van een leaseauto. Hoe het werkt, verschilt per werkgever. Vaak komt het bij je brutosalaris en wordt het belast zoals gewoon loon. Soms kun je een deel onbelast laten uitbetalen, bijvoorbeeld als kilometervergoeding voor woon-werkverkeer. Die vergoeding is in 2026 onbelast tot € 0,25 per kilometer.",
          "Met het budget betaal je zelf je vervoer. Dat kan je eigen auto zijn, een privé geleasede auto, het ov of een fiets. Wat je overhoudt, is voor jou.",
        ],
      },
      {
        heading: "Rekenvoorbeeld: budget tegenover leaseauto",
        paragraphs: [
          "Stel, je kunt kiezen tussen een leaseauto op benzine van € 40.000 en een mobiliteitsbudget van € 600 bruto per maand. De bijtelling van de leaseauto is 22%, dus € 8.800 per jaar. Bij een middeninkomen met een marginaal tarief van ongeveer 50% kost de auto je ongeveer € 367 per maand netto.",
          "Het budget van € 600 bruto levert bij datzelfde tarief ongeveer € 300 netto per maand op. Kies je het budget, dan heb je dus ongeveer € 667 per maand verschil om zelf vervoer van te regelen: de € 367 die je niet aan bijtelling kwijt bent plus de € 300 netto budget. Kost je eigen auto je minder dan dat, dan houd je over. Kost hij meer, dan is de leaseauto voordeliger.",
        ],
      },
      {
        heading: "Wat kost je eigen auto echt?",
        paragraphs: [
          "Bij je eigen auto betaal je alles zelf: brandstof, verzekering, motorrijtuigenbelasting, onderhoud, banden en het waardeverlies. Vooral het waardeverlies wordt vaak vergeten. Wie veel kilometers rijdt, ziet die kosten snel oplopen. Of een kilometervergoeding die kosten dekt, lees je in [kilometervergoeding: dekt het je autokosten?](/vragen/kilometervergoeding-onbelast).",
          "Rijd je weinig of ga je vaak met het ov of de fiets, dan houd je van een budget eerder iets over. Rijd je veel, ook privé, dan is een leaseauto met alle kosten inbegrepen vaak makkelijker te overzien.",
        ],
      },
      {
        heading: "Andere dingen om op te letten",
        paragraphs: [
          "Een leaseauto geeft zekerheid: je weet wat het kost en je hebt geen zorgen over reparaties. Een budget geeft vrijheid, maar ook risico. Een grote reparatie betaal je zelf. Let ook op de regels van je werkgever, bijvoorbeeld of het budget meetelt voor je pensioen of vakantiegeld. De belastingregels voor een auto van de zaak lees je in [wat is bijtelling?](/vragen/wat-is-bijtelling).",
          "Met de mobiliteitscalculator van Nettoplaatje zet je leaseauto, mobiliteitsbudget en eigen auto met kilometervergoeding naast elkaar. Je ziet per keuze wat je netto overhoudt. De uitkomst is een indicatie en hangt af van de bedragen die je invult.",
        ],
      },
    ],
    calculator: { href: "/mobiliteit", label: "Vergelijk leaseauto en budget" },
    related: [
      "wat-is-bijtelling",
      "kilometervergoeding-onbelast",
      "banen-eerlijk-vergelijken",
    ],
  },
  {
    slug: "kilometervergoeding-onbelast",
    title: "Kilometervergoeding: hoeveel is onbelast en dekt het je autokosten?",
    seoTitle: "Kilometervergoeding: hoeveel is onbelast?",
    description:
      "In 2026 is een kilometervergoeding onbelast tot € 0,25 per kilometer. Lees wat er gebeurt boven dat bedrag en hoe je nagaat of het je autokosten dekt.",
    updated: "2026-11-16",
    intro:
      "In 2026 mag je werkgever je maximaal € 0,25 per kilometer onbelast vergoeden voor woon-werkverkeer en zakelijke ritten. Krijg je meer, dan wordt het deel boven € 0,25 belast als loon. Of de vergoeding je autokosten dekt, hangt af van wat je auto je per kilometer echt kost.",
    sections: [
      {
        heading: "Hoeveel is onbelast?",
        paragraphs: [
          "De onbelaste kilometervergoeding is in 2026 maximaal € 0,25 per kilometer. Dat geldt voor kilometers die je zakelijk rijdt en voor woon-werkverkeer. Je werkgever is niet verplicht om een kilometervergoeding te geven. Of je die krijgt en hoeveel, hangt af van je contract of cao.",
          "Krijg je bijvoorbeeld € 0,30 per kilometer, dan is € 0,25 onbelast. Over de overige € 0,05 betaal je loonheffing, net als over je gewone salaris. Bij een middeninkomen houd je van dat extra deel ongeveer de helft over.",
        ],
      },
      {
        heading: "Wat kost je auto per kilometer?",
        paragraphs: [
          "Veel mensen denken bij autokosten alleen aan brandstof. Maar een auto kost meer: verzekering, motorrijtuigenbelasting, onderhoud, banden en waardeverlies. Als je meer kilometers rijdt, slijt de auto sneller en daalt de waarde sneller.",
          "Tel je al die kosten op en deel je ze door het aantal kilometers per jaar, dan krijg je je kosten per kilometer. Die verschillen sterk per auto. Een kleine zuinige auto kost per kilometer veel minder dan een grote, nieuwe auto.",
        ],
      },
      {
        heading: "Rekenvoorbeeld",
        paragraphs: [
          "Stel, je rijdt 1.200 kilometer per maand voor woon-werkverkeer. Je krijgt de maximale onbelaste vergoeding van € 0,25 per kilometer. Dat is € 300 per maand netto. Kost je auto je alles bij elkaar € 0,35 per kilometer, dan kost woon-werkverkeer je € 420 per maand. Je legt dan zelf € 120 per maand bij.",
          "Kost je auto je € 0,20 per kilometer, dan houd je juist iets over. Het loont dus om je eigen kosten per kilometer eens uit te rekenen. Ga je vaker naar kantoor, dan tellen de kosten snel op. Met de [werkpatroon-calculator](/werkpatroon) zie je wat extra kantoordagen kosten.",
        ],
      },
      {
        heading: "Kilometervergoeding of leaseauto?",
        paragraphs: [
          "Biedt een werkgever een leaseauto of een mobiliteitsbudget als alternatief, dan is het goed om die keuzes te vergelijken. Bij een leaseauto betaal je belasting over de bijtelling, maar zijn de meeste kosten gedekt. Meer daarover lees je in [leaseauto of mobiliteitsbudget](/vragen/leaseauto-of-mobiliteitsbudget).",
          "Met de kilometercalculator van Nettoplaatje vul je je afstand, je vergoeding en je autokosten in. Je ziet dan of de vergoeding je kosten dekt. De uitkomst is een indicatie. Je echte kosten hangen af van je auto en hoe je rijdt.",
        ],
      },
    ],
    calculator: { href: "/kilometervergoeding", label: "Bereken je autokosten" },
    related: [
      "leaseauto-of-mobiliteitsbudget",
      "wat-is-bijtelling",
      "reistijd-meetellen-nieuwe-baan",
    ],
  },
  {
    slug: "reistijd-meetellen-nieuwe-baan",
    title: "Telt reistijd mee als je een nieuwe baan kiest?",
    seoTitle: "Telt reistijd mee bij een nieuwe baan?",
    description:
      "Reistijd kost je tijd die je meestal niet betaald krijgt. Zo bereken je je netto uurloon inclusief reistijd en vergelijk je banen op afstand eerlijk.",
    updated: "2026-11-16",
    intro:
      "Ja, reistijd telt mee. Het is tijd die je kwijt bent voor je werk, maar die je meestal niet betaald krijgt. Door je netto inkomen te delen door je werkuren plus je reistijd, zie je wat je echt per uur verdient.",
    sections: [
      {
        heading: "Wat is netto uurloon inclusief reistijd?",
        paragraphs: [
          "Je gewone uurloon is je salaris gedeeld door je werkuren. Maar als je elke dag een uur in de auto of trein zit, besteed je meer tijd aan je werk dan je contract zegt. Het netto uurloon inclusief reistijd neemt die tijd mee.",
          "De berekening is eenvoudig: je netto inkomen na reiskosten, gedeeld door je werkuren plus je reisuren. Zo zie je hoeveel elk uur dat je aan je werk besteedt je oplevert.",
        ],
      },
      {
        heading: "Rekenvoorbeeld met twee banen",
        paragraphs: [
          "Baan A betaalt € 3.000 netto per maand. Je werkt 20 dagen van 8 uur, dus 160 uur. Je reist een uur per dag, samen 20 uur per maand. Je netto uurloon zonder reistijd is € 18,75. Met reistijd erbij is het € 3.000 gedeeld door 180 uur, ongeveer € 16,67.",
          "Baan B betaalt € 3.200 netto per maand, ook voor 160 uur. Maar je reist twee uur per dag, samen 40 uur per maand. Je netto uurloon inclusief reistijd is dan € 3.200 gedeeld door 200 uur, dus € 16,00. Baan B betaalt meer per maand, maar per uur dat je eraan kwijt bent levert baan A meer op.",
        ],
      },
      {
        heading: "Vergeet de reiskosten niet",
        paragraphs: [
          "In het voorbeeld hierboven zijn de reiskosten nog niet meegeteld. Bij een langere reis zijn die meestal ook hoger. Rijd je met je eigen auto en krijg je een kilometervergoeding, dan dekt die niet altijd je echte kosten. Hoe je dat nagaat, lees je in [kilometervergoeding: dekt het je autokosten?](/vragen/kilometervergoeding-onbelast).",
          "Werk je een deel van de week thuis, dan scheelt dat reistijd en reiskosten. Met de [werkpatroon-calculator](/werkpatroon) zie je wat een extra kantoordag je kost.",
        ],
      },
      {
        heading: "Reistijd is meer dan geld",
        paragraphs: [
          "Niet elke reis voelt hetzelfde. In de trein kun je lezen of werken. In de file kan dat niet. Sommige mensen gebruiken hun reistijd juist om tot rust te komen. Het netto uurloon inclusief reistijd geeft je een getal, maar hoe je die tijd ervaart, bepaal je zelf.",
          "Met de vergelijker van Nettoplaatje zet je twee banen naast elkaar, inclusief salaris, reiskosten en reistijd. Je ziet dan per baan je netto uurloon inclusief reistijd. De uitkomst is een indicatie, gebaseerd op de gegevens die je invult en de belastingregels van 2026.",
        ],
      },
    ],
    calculator: { href: "/totaal", label: "Vergelijk twee banen" },
    related: [
      "banen-eerlijk-vergelijken",
      "kilometervergoeding-onbelast",
      "leaseauto-of-mobiliteitsbudget",
    ],
  },
  {
    slug: "waarde-pensioen-en-arbeidsvoorwaarden",
    title: "Wat zijn je pensioen en andere arbeidsvoorwaarden waard?",
    seoTitle: "Wat zijn pensioen en extra's echt waard?",
    description:
      "Pensioen, vakantiedagen, 13e maand en bonus horen bij je beloning, ook als je ze niet netto terugziet. Zo bereken je wat je totale beloning echt waard is.",
    updated: "2026-11-16",
    intro:
      "Je pensioen en andere arbeidsvoorwaarden zijn vaak duizenden euro's per jaar waard, ook al zie je ze niet terug in je maandelijkse nettoloon. Denk aan de pensioenpremie van je werkgever, extra vakantiedagen, een 13e maand en een bonus. Wie banen vergelijkt, moet die onderdelen dus meetellen.",
    sections: [
      {
        heading: "Pensioen: de premie van je werkgever",
        paragraphs: [
          "Bij de meeste pensioenregelingen betalen jij en je werkgever allebei premie. Jouw deel gaat van je brutoloon af, vóór de belasting. Het deel van je werkgever zie je niet op je loonstrook als inkomen. Het hoort niet bij je nettoloon, maar wel bij je totale beloning.",
          "Pensioenregelingen verschillen sterk per werkgever. De ene werkgever betaalt een groot deel van de premie, de andere veel minder. Betaalt werkgever A € 400 per maand aan pensioenpremie en werkgever B € 200, dan krijg je bij A in feite € 200 per maand meer beloning. Je ziet dat geld pas later terug, als pensioen. Vraag bij een nieuwe baan daarom altijd naar de pensioenregeling.",
        ],
      },
      {
        heading: "Vakantiedagen",
        paragraphs: [
          "Wettelijk heb je recht op minimaal vier keer het aantal dagen dat je per week werkt. Bij een volle werkweek van vijf dagen is dat 20 vakantiedagen per jaar. Veel werkgevers geven meer. Elke extra vrije dag is ongeveer een dagloon waard, want je wordt doorbetaald terwijl je niet werkt.",
          "Biedt de ene baan 20 dagen en de andere 25, dan scheelt dat vijf betaalde vrije dagen per jaar. Bij een gelijk salaris levert de baan met meer vakantiedagen per gewerkt uur dus meer op.",
        ],
      },
      {
        heading: "Vakantiegeld, 13e maand en bonus",
        paragraphs: [
          "Vakantiegeld is wettelijk minimaal 8% van je brutosalaris. Een 13e maand is 8,33% van je jaarsalaris. Een bonus kan vast zijn of afhangen van resultaten. Al deze bedragen worden tegen je marginale tarief belast. Bij een middeninkomen houd je daar ongeveer de helft van over. Waarom dat zo is, lees je in [waarom je minder overhoudt van je vakantiegeld](/vragen/minder-over-van-vakantiegeld-en-bonus).",
        ],
      },
      {
        heading: "Andere voorwaarden",
        paragraphs: [
          "Er zijn nog meer voorwaarden die geld waard zijn. Denk aan een thuiswerkvergoeding, een opleidingsbudget, een reiskostenvergoeding of een auto van de zaak. Voor sommige vergoedingen gelden onbelaste maximumbedragen. De precieze bedragen staan op de website van de Belastingdienst. Niet alles is in geld uit te drukken. Flexibele werktijden of de mogelijkheid om thuis te werken kunnen voor jou ook veel waard zijn.",
          "Met de calculator voor arbeidsvoorwaarden van Nettoplaatje tel je salaris, pensioen, bonus en extra vakantiedagen op tot één totaalbedrag. Wil je twee complete banen naast elkaar zetten, gebruik dan de [vergelijker voor twee banen](/totaal). De uitkomsten zijn een indicatie. Hoe jouw pensioen precies wordt opgebouwd, staat in de regeling van je werkgever.",
        ],
      },
    ],
    calculator: { href: "/arbeidsvoorwaarden", label: "Bereken je totale beloning" },
    related: [
      "banen-eerlijk-vergelijken",
      "minder-over-van-vakantiegeld-en-bonus",
      "bruto-naar-netto",
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}
