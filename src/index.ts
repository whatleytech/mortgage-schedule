import {
  assetValue,
  percentagePutDown,
  annualInterestRate,
  loanTermYears,
  extraPayments,
  loanStartDate,
  currentDate,
} from "./inputs";
import { LoanAmortizationSchedule } from "./classes/loan-amortization-schedule";
import { LoanParameters } from "./interfaces/loan-parameters.interface";

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
 * Main function to run the loan amortization analysis
 */
const runLoanAnalysis = (): void => {
  // Create loan parameters
  const loanParams = createLoanParameters();

  // Initialize loan schedule
  const loanSchedule = new LoanAmortizationSchedule(loanParams);

  // Run the complete loan analysis
  loanSchedule.runLoanAnalysis(extraPayments, loanStartDate, currentDate);
};

// Run the analysis
runLoanAnalysis();
