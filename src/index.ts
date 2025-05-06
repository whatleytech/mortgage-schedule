import {
  assetValue,
  percentagePutDown,
  annualInterestRate,
  loanTermYears,
  extraPayments,
  loanStartDate,
  currentDate,
  question,
} from "./inputs";
import { LoanAmortizationSchedule } from "./classes/loan-amortization-schedule";
import { LoanParameters } from "./interfaces/loan-parameters.interface";
import "dotenv/config";
import OpenAI from "openai";
const client = new OpenAI();

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
// Create loan parameters
const loanParams: LoanParameters = {
  assetValue,
  percentagePutDown,
  interestRate: annualInterestRate,
  termInYears: loanTermYears,
};

// Initialize loan schedule
const loanSchedule = new LoanAmortizationSchedule(loanParams);

// Run the complete loan analysis
loanSchedule.runLoanAnalysis(extraPayments, loanStartDate, currentDate);

const adjustedSchedule = loanSchedule.applyExtraPayments(extraPayments);

const prompt = `
I am a first time homebuyer.

Consider the following:
- Current mortgage schedule: ${JSON.stringify(
  adjustedSchedule.generateAdjustedSchedule()
)}
- Loan terms: ${JSON.stringify(loanParams)}
- The loan started on ${loanStartDate} and today is ${currentDate}.
- In the schedule, you will notice that I have already started making extra payments towards the principal. Here are those details: ${JSON.stringify(
  extraPayments
)}

${question}
`;

client.responses
  .create({
    model: "gpt-4.1",
    input: prompt,
  })
  .then(({ output_text }) => console.log(output_text));
