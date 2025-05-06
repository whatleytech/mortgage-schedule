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

const loanParams: LoanParameters = {
  assetValue,
  percentagePutDown,
  interestRate: annualInterestRate,
  termInYears: loanTermYears,
};

const loanAnalysis = () => {
  console.log("Here are details for the Standard Schedule with no adjustments");
  const standardSchedule = new LoanAmortizationSchedule(loanParams);
  standardSchedule.runLoanAnalysis(loanStartDate, currentDate);

  console.log("\nHere are details for the Adjusted Schuled");
  const adjustedSchedule = standardSchedule.applyExtraPayments(extraPayments);
  adjustedSchedule.runLoanAnalysis(loanStartDate, currentDate);

  const standardStats = LoanAmortizationSchedule.calculateSummaryStats(
    standardSchedule.generateSchedule()
  );
  const adjustedStats = LoanAmortizationSchedule.calculateSummaryStats(
    adjustedSchedule.generateAdjustedSchedule()
  );

  LoanAmortizationSchedule.displaySavings(standardStats, adjustedStats);
};

const aiAssist = async () => {
  const standardSchedule = new LoanAmortizationSchedule(loanParams);
  const adjustedSchedule = standardSchedule.applyExtraPayments(extraPayments);

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
  - I have no coding background and would like the answer in plain english. The use of tables is appreciated

  ${question}
  `;

  const response = await client.responses.create({
    model: "gpt-4.1",
    input: prompt,
  });

  console.log(`\n${response.output_text}`);
};

loanAnalysis();
aiAssist();