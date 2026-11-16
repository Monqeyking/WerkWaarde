import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateWorkPattern, type WorkPatternInputs } from "../lib/work-costs.ts";

const base: WorkPatternInputs = {
  currentGrossSalary: 4500, newGrossSalary: 4500, currentPensionMonthly: 0, newPensionMonthly: 0, age: 35, holidayAllowance: 8,
  currentOfficeDays: 1, newOfficeDays: 4, currentChildcareDays: 0, newChildcareDays: 0,
  workWeeksPerYear: 46, currentOneWayKm: 25, newOneWayKm: 25, currentCommuteMinutesOneWay: 45, newCommuteMinutesOneWay: 45,
  currentReimbursementRate: 0.25, newReimbursementRate: 0.25,
  fuelConsumption: 7.5, fuelPrice: 2, ownCarIsElectric: false, electricConsumption: 18, electricityPrice: 0.3,
  otherVariableCostRate: 0.08, currentParkingPerOfficeDay: 0, newParkingPerOfficeDay: 0,
  currentLunchPerOfficeDay: 8, newLunchPerOfficeDay: 8, childcareCostPerDay: 0,
  currentOtherOfficeCostPerDay: 0, newOtherOfficeCostPerDay: 0, includeTimeValue: false, timeValuePerHour: 0,
};

const near = (actual: number, expected: number, tolerance = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

test("three extra office days match the explanation page example", () => {
  const result = calculateWorkPattern(base, 3000, 3000);
  near(result.kmDifference, 575);
  near(result.travelHoursDifference, 17.25);
  near(result.next.lunchCosts - result.current.lunchCosts, 92);
});

test("with equal net pay, the net difference is minus the extra costs", () => {
  const result = calculateWorkPattern(base, 3000, 3000);
  near(result.netDifference, -result.workCostDifference);
  near(result.annualNetDifference, result.netDifference * 12);
});

test("reimbursement is subtracted from vehicle costs", () => {
  const result = calculateWorkPattern(base, 3000, 3000);
  const perKm = 7.5 / 100 * 2 + 0.08 - 0.25;
  near(result.next.netTravelCosts, result.next.monthlyKm * perKm);
});

test("childcare counts per childcare day, not per office day", () => {
  const result = calculateWorkPattern({ ...base, newChildcareDays: 2, childcareCostPerDay: 100 }, 3000, 3000);
  near(result.next.childcareCosts, 2 * 100 * 46 / 12);
  assert.equal(result.current.childcareCosts, 0);
});

test("time only gets a money value when enabled", () => {
  const off = calculateWorkPattern({ ...base, timeValuePerHour: 20 }, 3000, 3000);
  const on = calculateWorkPattern({ ...base, includeTimeValue: true, timeValuePerHour: 20 }, 3000, 3000);
  assert.equal(off.timeValueDifference, 0);
  near(on.timeValueDifference, 17.25 * 20);
});
