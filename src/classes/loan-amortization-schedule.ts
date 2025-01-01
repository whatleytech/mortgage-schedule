import { ExtraPayment } from "../interfaces/extra-payment.interface";
import { Statement } from "../interfaces/statement.interface";

export class LoanAmortizationSchedule {
  private assetValue: number;
  private percentagePutDown: number; // Percentage (e.g., 20 for 20%)
  private loanAmount: number; // Derived from assetValue and percentagePutDown
  private interestRate: number; // Annual interest rate in percentage (e.g., 5 for 5%)
  private termInYears: number;
  private minimumPayment: number;
  private downPayment: number; // Calculated based on assetValue and percentagePutDown
  private extraPayments: ExtraPayment[]; // List to maintain history of extra payments

  /**
   * Constructs a new LoanAmortizationSchedule instance.
   * @param assetValue - The total value of the asset being financed.
   * @param percentagePutDown - The percentage of the asset value provided as a down payment.
   * @param interestRate - Annual interest rate in percentage (e.g., 5 for 5%).
   * @param termInYears - The term of the loan in years.
   * @param minimumPayment - The fixed monthly payment amount (optional).
   */
  constructor(
    assetValue: number,
    percentagePutDown: number,
    interestRate: number,
    termInYears: number,
    minimumPayment?: number // Optional: If not provided, calculate based on standard formula
  ) {
    // Basic validations
    if (assetValue <= 0) {
      throw new Error("Asset value must be greater than zero.");
    }
    if (percentagePutDown < 0 || percentagePutDown > 100) {
      throw new Error("Percentage put down must be between 0 and 100.");
    }
    if (interestRate < 0) {
      throw new Error("Interest rate cannot be negative.");
    }
    if (termInYears <= 0) {
      throw new Error("Term in years must be greater than zero.");
    }

    this.assetValue = assetValue;
    this.percentagePutDown = percentagePutDown;
    this.downPayment = parseFloat(
      (this.assetValue * (this.percentagePutDown / 100)).toFixed(2)
    );
    this.loanAmount = parseFloat(
      (this.assetValue - this.downPayment).toFixed(2)
    );
    this.interestRate = interestRate;
    this.termInYears = termInYears;
    this.extraPayments = []; // Initialize the extra payments history

    // If minimumPayment is provided, use it. Otherwise, calculate based on the standard mortgage formula.
    if (minimumPayment !== undefined) {
      if (minimumPayment <= 0) {
        throw new Error("Minimum payment must be greater than zero.");
      }
      this.minimumPayment = minimumPayment;
    } else {
      this.minimumPayment = parseFloat(
        this.calculateMonthlyPayment().toFixed(2)
      );
    }
  }

  /**
   * Calculates the standard monthly payment using the mortgage formula.
   * @returns The calculated monthly payment.
   */
  private calculateMonthlyPayment(): number {
    const monthlyRate = this.interestRate / 100 / 12;
    const numberOfPayments = this.termInYears * 12;
    if (monthlyRate === 0) {
      // If interest rate is 0%
      return this.loanAmount / numberOfPayments;
    }
    return (
      (this.loanAmount *
        monthlyRate *
        Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
    );
  }

  /**
   * Adds an extra payment to the extra payments history.
   * @param extraAmount - The additional amount to pay each month toward the principal.
   * @param startMonth - The month number from which to start making extra payments.
   */
  addExtraPayment(extraAmount: number, startMonth: number): void {
    // Validate input parameters
    if (extraAmount <= 0) {
      throw new Error("Extra payment amount must be greater than zero.");
    }
    if (
      !Number.isInteger(startMonth) ||
      startMonth < 1 ||
      startMonth > this.termInYears * 12
    ) {
      throw new Error(
        `Start month must be an integer between 1 and ${this.termInYears * 12}.`
      );
    }

    // Add the extra payment to the history
    this.extraPayments.push({ extraAmount, startMonth });

    // Sort the extra payments by startMonth to ensure correct application order
    this.extraPayments.sort((a, b) => a.startMonth - b.startMonth);
  }

  /**
   * Generates the regular loan amortization schedule without any extra payments.
   * @returns An array of Statement objects representing each month's payment details.
   */
  generateSchedule(): Statement[] {
    const schedule: Statement[] = [];
    const monthlyInterestRate = this.interestRate / 100 / 12;
    const totalMonths = this.termInYears * 12;
    let balance = this.loanAmount;

    for (let month = 1; month <= totalMonths; month++) {
      const startingBalance = balance;

      // Calculate interest for the month
      const interest = startingBalance * monthlyInterestRate;

      // Determine the payment amount
      let payment = this.minimumPayment;
      if (startingBalance + interest <= this.minimumPayment) {
        payment = startingBalance + interest;
      }

      const amountTowardInterest = interest;
      const amountTowardPrincipal = payment - amountTowardInterest;
      const endingBalance = startingBalance - amountTowardPrincipal;

      // Calculate Loan-to-Value (LTV) as both decimal and percentage
      const loanToValue = endingBalance / this.assetValue;
      const loanToValuePercentage = parseFloat((loanToValue * 100).toFixed(2));

      // Calculate Equity in value and percentage
      const equityValue = this.assetValue - endingBalance;
      const equityPercentage = parseFloat(
        ((equityValue / this.assetValue) * 100).toFixed(2)
      );

      // Push the statement for the current month
      schedule.push({
        month,
        startingBalance: parseFloat(startingBalance.toFixed(2)),
        payment: parseFloat(payment.toFixed(2)),
        amountTowardInterest: parseFloat(amountTowardInterest.toFixed(2)),
        amountTowardPrincipal: parseFloat(amountTowardPrincipal.toFixed(2)),
        endingBalance: parseFloat(endingBalance.toFixed(2)),
        loanToValue: parseFloat(loanToValue.toFixed(4)),
        loanToValuePercentage: loanToValuePercentage,
        equityValue: parseFloat(equityValue.toFixed(2)),
        equityPercentage: equityPercentage,
      });

      // Update the balance for the next month
      balance = endingBalance;

      // If the loan is paid off, exit the loop
      if (balance <= 0) {
        break;
      }
    }

    return schedule;
  }

  /**
   * Generates an adjusted amortization schedule with extra payments toward the principal.
   * Maintains the history of extra payments and applies them accordingly.
   * @returns An array of Statement objects representing each month's adjusted payment details.
   */
  generateAdjustedSchedule(): Statement[] {
    if (this.extraPayments.length === 0) {
      throw new Error(
        "No extra payments found. Please add extra payments using the addExtraPayment method before generating an adjusted schedule."
      );
    }

    const schedule: Statement[] = [];
    const monthlyInterestRate = this.interestRate / 100 / 12;
    const totalMonths = this.termInYears * 12;
    let balance = this.loanAmount;

    // Create a copy of the extraPayments array to track which payments have been applied
    const extraPaymentsCopy = [...this.extraPayments];

    for (let month = 1; month <= totalMonths; month++) {
      const startingBalance = balance;

      // Calculate interest for the month
      const interest = startingBalance * monthlyInterestRate;

      // Determine the payment amount
      let payment = this.minimumPayment;

      // Add all extra payments that have started by this month
      let applicableExtraPayments = 0;
      for (const extraPayment of extraPaymentsCopy) {
        if (month >= extraPayment.startMonth) {
          applicableExtraPayments += extraPayment.extraAmount;
        }
      }

      payment += applicableExtraPayments;

      // Adjust the final payment if necessary
      if (startingBalance + interest <= payment) {
        payment = startingBalance + interest;
      }

      const amountTowardInterest = interest;
      const amountTowardPrincipal = payment - amountTowardInterest;
      const endingBalance = startingBalance - amountTowardPrincipal;

      // Calculate Loan-to-Value (LTV) as both decimal and percentage
      const loanToValue = endingBalance / this.assetValue;
      const loanToValuePercentage = parseFloat((loanToValue * 100).toFixed(2));

      // Calculate Equity in value and percentage
      const equityValue = this.assetValue - endingBalance;
      const equityPercentage = parseFloat(
        ((equityValue / this.assetValue) * 100).toFixed(2)
      );

      // Push the statement for the current month
      schedule.push({
        month,
        startingBalance: parseFloat(startingBalance.toFixed(2)),
        payment: parseFloat(payment.toFixed(2)),
        amountTowardInterest: parseFloat(amountTowardInterest.toFixed(2)),
        amountTowardPrincipal: parseFloat(amountTowardPrincipal.toFixed(2)),
        endingBalance: parseFloat(endingBalance.toFixed(2)),
        loanToValue: parseFloat(loanToValue.toFixed(4)),
        loanToValuePercentage: loanToValuePercentage,
        equityValue: parseFloat(equityValue.toFixed(2)),
        equityPercentage: equityPercentage,
      });

      // Update the balance for the next month
      balance = endingBalance;

      // If the loan is paid off, exit the loop
      if (balance <= 0) {
        break;
      }
    }

    return schedule;
  }

  displaySummary(): void {
    console.log(`Asset Value: $${this.assetValue.toLocaleString()}`);
    console.log(
      `Down Payment (${
        this.percentagePutDown
      }%): $${this.downPayment.toLocaleString()}`
    );
    console.log(`Loan Amount: $${this.loanAmount.toLocaleString()}`);
    console.log(
      `Annual Interest Rate: ${this.interestRate}%`,
      `\nLoan Term: ${this.termInYears} years`
    );
    console.log(`Monthly Payment: $${this.minimumPayment.toLocaleString()}\n`);
  }
}
