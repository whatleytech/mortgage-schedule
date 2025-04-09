import {
  assetValue,
  percentagePutDown,
  annualInterestRate,
  loanTermYears,
  extraPayments,
} from "./inputs";
import { LoanAmortizationSchedule } from "./classes/loan-amortization-schedule";
import { Statement } from "./interfaces/statement.interface";
import { LoanParameters } from "./interfaces/loan-parameters.interface";
import { ExtraPayment } from "./interfaces/extra-payment.interface";

// Define interface for summary statistics
interface SummaryStats {
  totalPayments: number;
  totalInterest: number;
  totalPrincipal: number;
  monthsToPayoff: number;
}

/**
 * Creates loan parameters from input values
 */
const createLoanParameters = (): LoanParameters => ({
  assetValue,
  percentagePutDown,
  interestRate: annualInterestRate,
  termInYears: loanTermYears,
});

/**
 * Applies extra payments to a loan schedule
 */
const applyExtraPayments = (
  loan: LoanAmortizationSchedule,
  extraPayments: ExtraPayment[]
): LoanAmortizationSchedule => {
  return extraPayments.reduce(
    (loan, extra) => loan.addExtraPayment(extra.extraAmount, extra.startMonth),
    loan
  );
};

/**
 * Calculates summary statistics for a loan schedule
 */
const calculateSummaryStats = (schedule: Statement[]): SummaryStats => {
  const totalPayments = schedule.reduce(
    (sum, payment) => sum + payment.payment,
    0
  );
  const totalInterest = schedule.reduce(
    (sum, payment) => sum + payment.amountTowardInterest,
    0
  );
  const totalPrincipal = schedule.reduce(
    (sum, payment) => sum + payment.amountTowardPrincipal,
    0
  );
  const monthsToPayoff = schedule.length;

  return {
    totalPayments,
    totalInterest,
    totalPrincipal,
    monthsToPayoff,
  };
};

/**
 * Displays the first N months of a loan schedule
 */
const displayFirstMonths = (
  title: string,
  data: Statement[],
  count: number
): void => {
  console.log(`\n${title}:`);
  console.table(data.slice(0, count));
};

/**
 * Displays the last N months of a loan schedule
 */
const displayLastMonths = (
  title: string,
  data: Statement[],
  count: number
): void => {
  console.log(`\n${title}:`);
  console.table(data.slice(-count));
};

/**
 * Displays summary statistics for a loan schedule
 */
const displaySummaryStats = (title: string, stats: SummaryStats): void => {
  console.log(`\n${title}:`);
  console.log(`  Total Payments: $${stats.totalPayments.toLocaleString()}`);
  console.log(`  Total Interest: $${stats.totalInterest.toLocaleString()}`);
  console.log(`  Total Principal: $${stats.totalPrincipal.toLocaleString()}`);
  console.log(`  Months to Payoff: ${stats.monthsToPayoff}`);
};

/**
 * Displays savings from extra payments
 */
const displaySavings = (
  standardStats: SummaryStats,
  adjustedStats: SummaryStats
): void => {
  const interestSavings =
    standardStats.totalInterest - adjustedStats.totalInterest;
  const monthsSaved =
    standardStats.monthsToPayoff - adjustedStats.monthsToPayoff;

  console.log("\nSavings from Extra Payments:");
  console.log(`  Interest Saved: $${interestSavings.toLocaleString()}`);
  console.log(`  Months Saved: ${monthsSaved}`);
};

/**
 * Main function to run the loan amortization analysis
 */
const runLoanAnalysis = (): void => {
  // Create loan parameters
  const loanParams = createLoanParameters();

  // Initialize loan schedule
  const loanSchedule = new LoanAmortizationSchedule(loanParams);

  // Generate standard schedule
  const standardSchedule = loanSchedule.generateSchedule();

  // Apply extra payments and generate adjusted schedule
  const loanWithExtraPayments = applyExtraPayments(loanSchedule, extraPayments);
  const adjustedSchedule = loanWithExtraPayments.generateAdjustedSchedule();

  // Display loan summary
  loanSchedule.displaySummary();

  // Display first months of both schedules
  displayFirstMonths(
    "First 24 Months of Standard Amortization Schedule",
    standardSchedule,
    24
  );
  displayFirstMonths(
    "First 24 Months of Adjusted Amortization Schedule",
    adjustedSchedule,
    24
  );

  // Display last months of both schedules
  displayLastMonths(
    "Last 3 Months of Standard Amortization Schedule",
    standardSchedule,
    3
  );
  displayLastMonths(
    "Last 3 Months of Adjusted Amortization Schedule",
    adjustedSchedule,
    3
  );

  // Calculate and display statistics
  const standardStats = calculateSummaryStats(standardSchedule);
  const adjustedStats = calculateSummaryStats(adjustedSchedule);

  displaySummaryStats("Summary Statistics - Standard Schedule", standardStats);
  displaySummaryStats("Summary Statistics - Adjusted Schedule", adjustedStats);

  // Display savings
  displaySavings(standardStats, adjustedStats);
};

// Run the analysis
runLoanAnalysis();
