import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { HOUSE_ADS, houseAdAdvertisers } from "../lib/ads.ts";
import { AFFILIATE_OFFERS, activeOffers, affiliateAdvertisers, affiliateOfferFor, isActiveOffer, legalUpdatedText, type AffiliateOffer } from "../lib/affiliates.ts";
import { getArticle } from "../lib/articles.ts";

const offer = (patch: Partial<AffiliateOffer> = {}): AffiliateOffer => ({
  ...AFFILIATE_OFFERS[0],
  advertiser: "Voorbeeld Lease",
  href: "https://example.com/lease?id=1",
  since: "2026-12-01",
  ...patch,
});

test("an offer is live only with advertiser, an https link and a valid start date", () => {
  assert.equal(isActiveOffer(offer()), true);
  assert.equal(isActiveOffer(offer({ advertiser: " " })), false);
  assert.equal(isActiveOffer(offer({ href: "" })), false);
  assert.equal(isActiveOffer(offer({ href: "http://example.com" })), false);
  assert.equal(isActiveOffer(offer({ href: "javascript:alert(1)" })), false);
  assert.equal(isActiveOffer(offer({ since: "" })), false);
  assert.equal(isActiveOffer(offer({ since: "1 december" })), false);
});

test("the shipped config stays off until the tracking link is filled in", () => {
  // Remove this test, or update it, once an offer goes live on purpose.
  assert.deepEqual(activeOffers(), []);
  assert.equal(affiliateOfferFor("mobiliteit"), null);
  assert.deepEqual(affiliateAdvertisers(), []);
});

test("a live offer shows only on its own placements, not on English pages or embeds", () => {
  const offers = [offer()];
  assert.equal(affiliateOfferFor("mobiliteit", offers)?.id, "private-lease");
  assert.equal(affiliateOfferFor("kilometervergoeding", offers)?.id, "private-lease");
  for (const placement of ["bijtelling", "home", "bruto-netto-bedrag", "en-salary", "mobiliteit-midden"]) {
    assert.equal(affiliateOfferFor(placement, offers), null, placement);
  }
});

test("affiliate placements point at pages that exist", () => {
  for (const placement of AFFILIATE_OFFERS.flatMap((item) => item.placements)) {
    if (placement.startsWith("vragen-")) assert.ok(getArticle(placement.slice("vragen-".length)), placement);
  }
  const app = readFileSync(new URL("../app/CalculatorApp.tsx", import.meta.url), "utf8");
  assert.match(app, /<AdSlot placement="mobiliteit"/);
  const km = readFileSync(new URL("../app/kilometervergoeding/page.tsx", import.meta.url), "utf8");
  assert.match(km, /adPlacement="kilometervergoeding"/);
});

test("affiliate ads stay apart from the Virtrust house ads", () => {
  const names = affiliateAdvertisers([offer(), offer({ id: "tweede" })]);
  assert.deepEqual(names, ["Voorbeeld Lease"]);
  assert.ok(!HOUSE_ADS.some((ad) => ad.id === AFFILIATE_OFFERS[0].id));
  assert.deepEqual(houseAdAdvertisers(), ["Virtrust"]);
});

test("copy is complete and says what we get paid for", () => {
  for (const item of AFFILIATE_OFFERS) {
    for (const field of [item.title, item.body, item.cta, item.disclosure]) assert.ok(field.trim().length > 0, item.id);
    assert.match(item.disclosure, /vergoeding/);
  }
});

test("legal pages keep their own date until a live offer is newer", () => {
  assert.equal(legalUpdatedText("2026-11-20", []), "20 november 2026");
  assert.equal(legalUpdatedText("2026-11-20", [offer({ since: "2026-12-01" })]), "1 december 2026");
  assert.equal(legalUpdatedText("2026-11-20", [offer({ since: "2026-11-01" })]), "20 november 2026");
  assert.equal(legalUpdatedText("2026-11-20", [offer({ href: "" })]), "20 november 2026");
  assert.equal(legalUpdatedText("2026-11-20"), "20 november 2026");
});
