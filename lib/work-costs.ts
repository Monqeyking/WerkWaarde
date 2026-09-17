export type WorkPatternInputs = {
  currentGrossSalary: number;
  newGrossSalary: number;
  currentPensionMonthly: number;
  newPensionMonthly: number;
  age: number;
  holidayAllowance: number;
  currentOfficeDays: number;
  newOfficeDays: number;
  currentChildcareDays: number;
  newChildcareDays: number;
  workWeeksPerYear: number;
  currentOneWayKm: number;
  newOneWayKm: number;
  currentCommuteMinutesOneWay: number;
  newCommuteMinutesOneWay: number;
  currentReimbursementRate: number;
  newReimbursementRate: number;
  fuelConsumption: number;
  fuelPrice: number;
  ownCarIsElectric: boolean;
  electricConsumption: number;
  electricityPrice: number;
  otherVariableCostRate: number;
  currentParkingPerOfficeDay: number;
  newParkingPerOfficeDay: number;
  currentLunchPerOfficeDay: number;
  newLunchPerOfficeDay: number;
  childcareCostPerDay: number;
  currentOtherOfficeCostPerDay: number;
  newOtherOfficeCostPerDay: number;
  includeTimeValue: boolean;
  timeValuePerHour: number;
};

export function calculateWorkPattern(inputs: WorkPatternInputs, currentNetMonthlyAverage: number, newNetMonthlyAverage: number) {
  const weeks = Math.max(0, inputs.workWeeksPerYear);
  const energyPerKm = inputs.ownCarIsElectric
    ? Math.max(0, inputs.electricConsumption) / 100 * Math.max(0, inputs.electricityPrice)
    : Math.max(0, inputs.fuelConsumption) / 100 * Math.max(0, inputs.fuelPrice);
  const calculateSituation = (officeDays: number, childcareDays: number, oneWayKm: number, commuteMinutes: number, reimbursementRate: number, parkingPerOfficeDay: number, lunchPerOfficeDay: number, otherOfficeCostPerDay: number, netMonthlyAverage: number) => {
    const monthlyOfficeDays = Math.max(0, officeDays) * weeks / 12;
    const monthlyKm = monthlyOfficeDays * Math.max(0, oneWayKm) * 2;
    const energyCosts = monthlyKm * energyPerKm;
    const otherVariableCosts = monthlyKm * Math.max(0, inputs.otherVariableCostRate);
    const vehicleCosts = energyCosts + otherVariableCosts;
    const reimbursement = monthlyKm * Math.max(0, reimbursementRate);
    const netTravelCosts = vehicleCosts - reimbursement;
    const parkingCosts = monthlyOfficeDays * Math.max(0, parkingPerOfficeDay);
    const lunchCosts = monthlyOfficeDays * Math.max(0, lunchPerOfficeDay);
    const otherOfficeCosts = monthlyOfficeDays * Math.max(0, otherOfficeCostPerDay);
    const childcareCosts = Math.max(0, childcareDays) * Math.max(0, inputs.childcareCostPerDay) * weeks / 12;
    const travelHours = monthlyOfficeDays * Math.max(0, commuteMinutes) * 2 / 60;
    const timeValue = inputs.includeTimeValue ? travelHours * Math.max(0, inputs.timeValuePerHour) : 0;
    const workCosts = netTravelCosts + parkingCosts + lunchCosts + otherOfficeCosts + childcareCosts;
    return { monthlyOfficeDays, monthlyKm, energyCosts, otherVariableCosts, vehicleCosts, reimbursement, netTravelCosts, parkingCosts, lunchCosts, otherOfficeCosts, childcareCosts, travelHours, timeValue, workCosts, totalCosts: workCosts + timeValue, netAfterCosts: netMonthlyAverage - workCosts - timeValue };
  };
  const current = calculateSituation(inputs.currentOfficeDays, inputs.currentChildcareDays, inputs.currentOneWayKm, inputs.currentCommuteMinutesOneWay, inputs.currentReimbursementRate, inputs.currentParkingPerOfficeDay, inputs.currentLunchPerOfficeDay, inputs.currentOtherOfficeCostPerDay, currentNetMonthlyAverage);
  const next = calculateSituation(inputs.newOfficeDays, inputs.newChildcareDays, inputs.newOneWayKm, inputs.newCommuteMinutesOneWay, inputs.newReimbursementRate, inputs.newParkingPerOfficeDay, inputs.newLunchPerOfficeDay, inputs.newOtherOfficeCostPerDay, newNetMonthlyAverage);
  const difference = (key: keyof typeof current) => next[key] as number - (current[key] as number);
  return {
    current,
    next,
    officeDayDifference: next.monthlyOfficeDays - current.monthlyOfficeDays,
    kmDifference: difference("monthlyKm"),
    travelHoursDifference: difference("travelHours"),
    workCostDifference: difference("workCosts"),
    timeValueDifference: difference("timeValue"),
    totalImpact: difference("totalCosts") - (newNetMonthlyAverage - currentNetMonthlyAverage),
    netDifference: next.netAfterCosts - current.netAfterCosts,
    annualNetDifference: (next.netAfterCosts - current.netAfterCosts) * 12,
  };
}
