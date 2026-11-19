import { existsSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { HOUSE_ADS, adsenseUnit, houseAdAdvertisers, houseAdHref, houseAdsEnabled, pickHouseAd } from "../lib/ads.ts";

const adsense = { publisherId: "ca-pub-123", slotId: "456" };
const sequence = (...values: number[]) => () => values.shift() ?? 0;

test("the AdSense box needs both a publisher and a slot id", () => {
  assert.deepEqual(adsenseUnit(adsense), adsense);
  assert.equal(adsenseUnit({ publisherId: "ca-pub-123" }), null);
  assert.equal(adsenseUnit({}), null);
});

test("house ads are on by default and off only with 0", () => {
  assert.equal(houseAdsEnabled({}), true);
  assert.equal(houseAdsEnabled({ houseAds: "" }), true);
  assert.equal(houseAdsEnabled({ houseAds: "1" }), true);
  assert.equal(houseAdsEnabled({ houseAds: " 0 " }), false);
  assert.equal(houseAdsEnabled({ ...adsense, houseAds: "0" }), false, "independent of AdSense");
});

test("pickHouseAd skips house ads already on the page while others are left", () => {
  const first = HOUSE_ADS[0].id;
  for (const draw of [0, 0.5, 0.999999]) {
    const choice = pickHouseAd({ placement: "totaal", exclude: [first], random: sequence(draw) });
    assert.notEqual(choice.ad.id, first);
  }
  const all = pickHouseAd({ placement: "totaal", exclude: HOUSE_ADS.map((ad) => ad.id), random: sequence(0) });
  assert.equal(all.ad.id, HOUSE_ADS[0].id);
});

test("pickHouseAd never indexes past the pool and tags the link", () => {
  const choice = pickHouseAd({ placement: "totaal", random: sequence(0.999999) });
  assert.equal(choice.ad.id, HOUSE_ADS[HOUSE_ADS.length - 1].id);
  assert.match(choice.href, /utm_content=totaal/);
});

test("house ads promote services, not vacancies", () => {
  for (const ad of HOUSE_ADS) assert.doesNotMatch(`${ad.title} ${ad.body} ${ad.cta}`, /vacature/i);
});

test("house ad links carry UTM tags for the placement", () => {
  const url = new URL(houseAdHref(HOUSE_ADS[0], "totaal"));
  assert.equal(url.searchParams.get("utm_source"), "nettoplaatje");
  assert.equal(url.searchParams.get("utm_medium"), "house-ad");
  assert.equal(url.searchParams.get("utm_campaign"), HOUSE_ADS[0].id);
  assert.equal(url.searchParams.get("utm_content"), "totaal");
});

test("house ads have unique ids and complete copy", () => {
  assert.equal(new Set(HOUSE_ADS.map((ad) => ad.id)).size, HOUSE_ADS.length);
  for (const ad of HOUSE_ADS) for (const field of [ad.title, ad.body, ad.cta, ad.advertiser]) assert.ok(field.trim().length > 0);
});

test("house ad advertisers are listed once each for the legal pages", () => {
  const names = houseAdAdvertisers();
  assert.deepEqual(names, [...new Set(names)]);
  assert.ok(names.includes("Virtrust"));
});

test("house ad logos exist under public/", () => {
  for (const ad of HOUSE_ADS) {
    if (ad.logo) assert.ok(existsSync(new URL(`../public${ad.logo}`, import.meta.url)), `${ad.id}: ${ad.logo} missing`);
  }
});
