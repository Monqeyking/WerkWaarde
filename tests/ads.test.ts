import assert from "node:assert/strict";
import test from "node:test";
import { HOUSE_ADS, adsEnabled, houseAdHref, houseAdShare, pickAd } from "../lib/ads.ts";

const adsense = { publisherId: "ca-pub-123", slotId: "456" };
const sequence = (...values: number[]) => () => values.shift() ?? 0;

test("house ad share defaults to 50% with AdSense and 100% without", () => {
  assert.equal(houseAdShare(adsense), 50);
  assert.equal(houseAdShare({}), 100);
  assert.equal(houseAdShare({ ...adsense, houseShare: "80" }), 80);
  assert.equal(houseAdShare({ ...adsense, houseShare: "250" }), 100);
  assert.equal(houseAdShare({ houseShare: "30" }), 100, "nothing else to show without AdSense");
  assert.equal(houseAdShare({ houseShare: "0" }), 0);
  assert.equal(houseAdShare({ houseShare: "abc" }), 100);
});

test("ads are off only when AdSense is missing and house ads are disabled", () => {
  assert.equal(adsEnabled({}), true);
  assert.equal(adsEnabled({ houseShare: "0" }), false);
  assert.equal(adsEnabled({ ...adsense, houseShare: "0" }), true);
  assert.equal(pickAd({ houseShare: "0" }, { placement: "home" }), null);
});

test("pickAd splits between house ads and AdSense by share", () => {
  const config = { ...adsense, houseShare: "60" };
  assert.equal(pickAd(config, { placement: "home", random: sequence(0.59, 0) })?.kind, "house");
  assert.deepEqual(pickAd(config, { placement: "home", random: sequence(0.6) }), { kind: "adsense", publisherId: "ca-pub-123", slotId: "456" });
  assert.equal(pickAd({ ...adsense, houseShare: "0" }, { placement: "home", random: sequence(0) })?.kind, "adsense");
});

test("pickAd respects the audience and never indexes past the pool", () => {
  for (const audience of ["candidate", "employer"] as const) {
    const choice = pickAd({}, { placement: "totaal", audience, random: sequence(0.999999) });
    assert.equal(choice?.kind, "house");
    if (choice?.kind === "house") assert.equal(choice.ad.audience, audience);
  }
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
