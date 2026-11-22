import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { clampNumber, formatNumberInput, parseNumberInput } from "../lib/number-input.ts";

describe("reading typed numbers", () => {
  test("plain numbers, leading zeros and spaces", () => {
    assert.equal(parseNumberInput("3500"), 3500);
    assert.equal(parseNumberInput("03500"), 3500);
    assert.equal(parseNumberInput(" 3 500 "), 3500);
    assert.equal(parseNumberInput("0"), 0);
  });

  test("Dutch notation: dot for thousands, comma for decimals", () => {
    assert.equal(parseNumberInput("3.500"), 3500);
    assert.equal(parseNumberInput("3.500,50"), 3500.5);
    assert.equal(parseNumberInput("3500,50"), 3500.5);
    assert.equal(parseNumberInput("1.234.567"), 1234567);
    assert.equal(parseNumberInput("€ 3.500,-"), 3500);
    assert.equal(parseNumberInput("€3.500,--"), 3500);
    assert.equal(parseNumberInput("3500 EUR"), 3500);
  });

  test("English notation: comma for thousands, dot for decimals", () => {
    assert.equal(parseNumberInput("3,500"), 3500);
    assert.equal(parseNumberInput("3,500.60"), 3500.6);
    assert.equal(parseNumberInput("3500.60"), 3500.6);
    assert.equal(parseNumberInput("70,000"), 70000);
  });

  test("decimal fields keep three decimals as decimals", () => {
    assert.equal(parseNumberInput("8,333", true), 8.333);
    assert.equal(parseNumberInput("0,215", true), 0.215);
    assert.equal(parseNumberInput("8,33", true), 8.33);
    assert.equal(parseNumberInput("12,5%", true), 12.5);
    assert.equal(parseNumberInput("0,500"), 0.5);
  });

  test("half-typed input still reads", () => {
    assert.equal(parseNumberInput("3500,"), 3500);
    assert.equal(parseNumberInput(",5"), 0.5);
    assert.equal(parseNumberInput("-5"), -5);
  });

  test("text that is not a number is rejected", () => {
    for (const text of ["", " ", "abc", "1e9", "1e308", ".", "3.5.00", "3,50.000", "12a", "--5", "Infinity"]) {
      assert.equal(parseNumberInput(text), null, text);
    }
  });
});

describe("showing and limiting numbers", () => {
  test("decimal comma on Dutch pages, dot on English pages", () => {
    assert.equal(formatNumberInput(8.33), "8,33");
    assert.equal(formatNumberInput(8.33, "en"), "8.33");
    assert.equal(formatNumberInput(3500), "3500");
    assert.equal(formatNumberInput(Number.NaN), "");
  });

  test("clamps to the field's limits", () => {
    assert.equal(clampNumber(101, 16, 100), 100);
    assert.equal(clampNumber(-5, 0), 0);
    assert.equal(clampNumber(99_999_999, 0), 99_999_999);
  });
});
