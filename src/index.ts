import {
  assetValue,
  percentagePutDown,
  annualInterestRate,
  loanTermYears,
  extraPayments,
} from "./inputs";
import { LoanAmortizationSchedule } from "./classes/loan-amortization-schedule";

// Initialize LoanAmortizationSchedule without specifying minimumPayment,
// so it will be calculated based on the standard mortgage formula.
const loanSchedule = new LoanAmortizationSchedule(
  assetValue,
  percentagePutDown,
  annualInterestRate,
  loanTermYears
);

// Generate the amortization schedule
const schedule = loanSchedule.generateSchedule();

// Add adjustment for extra payments
for (const extra of extraPayments) {
  loanSchedule.addExtraPayment(extra.extraAmount, extra.startMonth);
}

const adjustedSchedule = loanSchedule.generateAdjustedSchedule();

// Display Summary
loanSchedule.displaySummary();

// Display the first 24 months as a sample
console.log("First 24 Months of Amortization Schedule:");
console.table(schedule.slice(0, 24));
console.log("First 24 Months of Adjusted Amortization Schedule:");
console.table(adjustedSchedule.slice(0, 24));

// Optionally, display the last few months to see the payoff
console.log("Last 3 Months of Amortization Schedule:");
console.table(schedule.slice(-3));
console.log("Last 3 Months of Adjusted Amortization Schedule:");
console.table(adjustedSchedule.slice(-3));
