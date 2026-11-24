import assert from "node:assert/strict";
import { test } from "node:test";
import { decimal, money, ratePercent, signedDecimal, signedMoney, signedMoneyCents } from "../lib/format.ts";

// Intl uses a non-breaking space between € and the amount.
const plain = (text: string) => text.replace(/ /g, " ");

test("negative amounts put the minus sign before the euro sign", () => {
  assert.equal(plain(money(-46.2)), "−€ 46");
  assert.equal(plain(money(1234)), "€ 1.234");
  assert.equal(plain(signedMoney(214)), "+€ 214");
  assert.equal(plain(signedMoney(-1449)), "−€ 1.449");
});

test("values that round to zero have no sign", () => {
  assert.equal(plain(signedMoney(0.4)), "€ 0");
  assert.equal(plain(signedMoney(-0.4)), "€ 0");
  assert.equal(plain(signedMoneyCents(-0.004)), "€ 0,00");
});

test("decimals use a comma", () => {
  assert.equal(decimal(17.25), "17,3");
  assert.equal(signedDecimal(-3), "−3");
});

test("ratePercent shows official rates exactly, without trailing zeros", () => {
  assert.equal(ratePercent(0.3575), "35,75%");
  assert.equal(ratePercent(0.3756), "37,56%");
  assert.equal(ratePercent(0.495), "49,5%");
  assert.equal(ratePercent(0.06398), "6,4%");
  assert.equal(ratePercent(0.0651), "6,51%");
});
