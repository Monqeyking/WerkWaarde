import assert from "node:assert/strict";
import { test } from "node:test";
import { decimal, money, signedDecimal, signedMoney, signedMoneyCents } from "../lib/format.ts";

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
