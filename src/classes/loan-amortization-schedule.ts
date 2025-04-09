import { ExtraPayment } from "../interfaces/extra-payment.interface";
import { Statement } from "../interfaces/statement.interface";
import {
  LoanParameters,
  LOAN_CONSTRAINTS,
} from "../interfaces/loan-parameters.interface";
import {
  LoanValidationError,
  InvalidExtraPaymentError,
} from "../errors/loan-errors";

// Define interface for summary statistics
interface SummaryStats {
  totalPayments: number;
  totalInterest: number;
  totalPrincipal: number;
  monthsToPayoff: number;
}

/**
 * A class that calculates and generates loan amortization schedules.
 * Supports standard amortization and schedules with extra payments.
 *
 * This class is designed to be immutable - all operations that would modify state
 * return a new instance instead.
 *
 * @example
 * ```typescript
 * // Create a new loan schedule
 * const loan = new LoanAmortizationSchedule({
 *   assetValue: 300000,
 *   percentagePutDown: 20,
 *   interestRate: 5,
 *   termInYears: 30
 * });
 *
 * // Generate a standard amortization schedule
 * const schedule = loan.generateSchedule();
 *
 * // Add an extra payment and get a new instance
 * const loanWithExtraPayment = loan.addExtraPayment(100, 12);
 *
 * // Generate an adjusted schedule with the extra payment
 * const adjustedSchedule = loanWithExtraPayment.generateAdjustedSchedule();
 * ```
 */
export class LoanAmortizationSchedule {
  private readonly assetValue: number;
  private readonly percentagePutDown: number;
  private readonly loanAmount: number;
  private readonly interestRate: number;
  private readonly termInYears: number;
  private readonly minimumPayment: number;
  private readonly downPayment: number;
  private readonly extraPayments: ExtraPayment[];

  /**
   * Creates a new loan amortization schedule.
   *
   * @param params - The loan parameters
   * @throws {LoanValidationError} if any parameters are invalid
   */
  constructor(params: LoanParameters) {
    this.validateInputs(params);

    this.assetValue = params.assetValue;
    this.percentagePutDown = params.percentagePutDown;
    this.interestRate = params.interestRate;
    this.termInYears = params.termInYears;

    // Calculate derived values
    this.downPayment = this.calculateDownPayment();
    this.loanAmount = this.calculateLoanAmount();
    this.minimumPayment =
      params.minimumPayment !== undefined
        ? params.minimumPayment
        : this.calculateStandardMonthlyPayment();

    // Initialize with empty extra payments
    this.extraPayments = [];
  }

  /**
   * Validates all input parameters.
   *
   * @param params - The loan parameters to validate
   * @throws {LoanValidationError} if any parameters are invalid
   */
  private validateInputs(params: LoanParameters): void {
    if (params.assetValue <= LOAN_CONSTRAINTS.MIN_ASSET_VALUE) {
      throw new LoanValidationError(
        `Asset value must be at least $${LOAN_CONSTRAINTS.MIN_ASSET_VALUE.toLocaleString()}.`,
        "assetValue"
      );
    }

    if (params.assetValue > LOAN_CONSTRAINTS.MAX_ASSET_VALUE) {
      throw new LoanValidationError(
        `Asset value cannot exceed $${LOAN_CONSTRAINTS.MAX_ASSET_VALUE.toLocaleString()}.`,
        "assetValue"
      );
    }

    if (params.percentagePutDown < 0 || params.percentagePutDown > 100) {
      throw new LoanValidationError(
        "Percentage put down must be between 0 and 100.",
        "percentagePutDown"
      );
    }

    if (params.interestRate < LOAN_CONSTRAINTS.MIN_INTEREST_RATE) {
      throw new LoanValidationError(
        "Interest rate cannot be negative.",
        "interestRate"
      );
    }

    if (params.interestRate > LOAN_CONSTRAINTS.MAX_INTEREST_RATE) {
      throw new LoanValidationError(
        `Interest rate cannot exceed ${LOAN_CONSTRAINTS.MAX_INTEREST_RATE}%.`,
        "interestRate"
      );
    }

    if (params.termInYears < LOAN_CONSTRAINTS.MIN_TERM_YEARS) {
      throw new LoanValidationError(
        `Loan term must be at least ${LOAN_CONSTRAINTS.MIN_TERM_YEARS} years.`,
        "termInYears"
      );
    }

    if (params.termInYears > LOAN_CONSTRAINTS.MAX_TERM_YEARS) {
      throw new LoanValidationError(
        `Loan term cannot exceed ${LOAN_CONSTRAINTS.MAX_TERM_YEARS} years.`,
        "termInYears"
      );
    }

    if (params.minimumPayment !== undefined && params.minimumPayment <= 0) {
      throw new LoanValidationError(
        "Minimum payment must be greater than zero.",
        "minimumPayment"
      );
    }
  }

  /**
   * Calculates the down payment amount based on asset value and percentage.
   */
  private calculateDownPayment(): number {
    return parseFloat(
      (this.assetValue * (this.percentagePutDown / 100)).toFixed(2)
    );
  }

  /**
   * Calculates the loan amount (asset value minus down payment).
   */
  private calculateLoanAmount(): number {
    return parseFloat((this.assetValue - this.downPayment).toFixed(2));
  }

  /**
   * Calculates the standard monthly payment using the mortgage formula.
   *
   * The formula used is:
   * P = L[r(1+r)^n]/[(1+r)^n-1]
   *
   * Where:
   * P = Monthly payment
   * L = Loan amount
   * r = Monthly interest rate (annual rate / 12)
   * n = Total number of payments (years * 12)
   */
  private calculateStandardMonthlyPayment(): number {
    const monthlyRate = this.interestRate / 100 / 12;
    const numberOfPayments = this.termInYears * 12;

    if (monthlyRate === 0) {
      // If interest rate is 0%
      return this.loanAmount / numberOfPayments;
    }

    return parseFloat(
      (
        (this.loanAmount *
          monthlyRate *
          Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
      ).toFixed(2)
    );
  }

  /**
   * Adds an extra payment to the loan schedule.
   * Returns a new instance with the extra payment added.
   *
   * @param extraAmount - The additional amount to pay each month toward the principal
   * @param startMonth - The month number from which to start making extra payments
   * @returns A new LoanAmortizationSchedule instance with the extra payment added
   * @throws {InvalidExtraPaymentError} if parameters are invalid
   */
  addExtraPayment(
    extraAmount: number,
    startMonth: number
  ): LoanAmortizationSchedule {
    if (extraAmount <= 0) {
      throw new InvalidExtraPaymentError(
        "Extra payment amount must be greater than zero."
      );
    }

    const totalMonths = this.termInYears * 12;
    if (
      !Number.isInteger(startMonth) ||
      startMonth < 1 ||
      startMonth > totalMonths
    ) {
      throw new InvalidExtraPaymentError(
        `Start month must be an integer between 1 and ${totalMonths}.`
      );
    }

    // Create a new instance with the extra payment added
    const newInstance = new LoanAmortizationSchedule({
      assetValue: this.assetValue,
      percentagePutDown: this.percentagePutDown,
      interestRate: this.interestRate,
      termInYears: this.termInYears,
      minimumPayment: this.minimumPayment,
    });

    // Add the new extra payment to the existing ones
    const allExtraPayments = [
      ...this.extraPayments,
      { extraAmount, startMonth },
    ];
    allExtraPayments.sort((a, b) => a.startMonth - b.startMonth);

    // Use Object.assign to copy the extra payments to the new instance
    // This is a bit of a hack since we're modifying a readonly property
    // In a real-world scenario, you might want to redesign this part
    Object.defineProperty(newInstance, "extraPayments", {
      value: allExtraPayments,
      writable: false,
      configurable: false,
    });

    return newInstance;
  }

  /**
   * Generates the standard loan amortization schedule without extra payments.
   *
   * @returns An array of Statement objects representing each month's payment details
   */
  generateSchedule(): Statement[] {
    return this.generateAmortizationSchedule(false);
  }

  /**
   * Generates an adjusted amortization schedule with extra payments.
   *
   * @returns An array of Statement objects representing each month's adjusted payment details
   */
  generateAdjustedSchedule(): Statement[] {
    if (this.extraPayments.length === 0) {
      return this.generateAmortizationSchedule(false);
    }

    return this.generateAmortizationSchedule(true);
  }

  /**
   * Generates the amortization schedule with or without extra payments.
   *
   * @param includeExtraPayments - Whether to include extra payments in the schedule
   * @returns An array of Statement objects
   */
  private generateAmortizationSchedule(
    includeExtraPayments: boolean
  ): Statement[] {
    const schedule: Statement[] = [];
    const monthlyInterestRate = this.interestRate / 100 / 12;
    const totalMonths = this.termInYears * 12;
    let balance = this.loanAmount;

    for (let month = 1; month <= totalMonths; month++) {
      const startingBalance = balance;
      const interest = startingBalance * monthlyInterestRate;

      // Calculate payment amount
      let payment = this.minimumPayment;

      // Add extra payments if applicable
      if (includeExtraPayments) {
        payment += this.calculateExtraPaymentsForMonth(month);
      }

      // For the last payment, ensure we pay exactly the remaining balance plus interest
      if (month === totalMonths || startingBalance + interest <= payment) {
        payment = startingBalance + interest;
      }

      // Calculate payment breakdown
      const amountTowardInterest = interest;
      const amountTowardPrincipal = payment - amountTowardInterest;
      const endingBalance = startingBalance - amountTowardPrincipal;

      // Calculate LTV and equity metrics
      const {
        loanToValue,
        loanToValuePercentage,
        equityValue,
        equityPercentage,
      } = this.calculateEquityMetrics(endingBalance);

      // Add statement for current month
      schedule.push({
        month,
        startingBalance: parseFloat(startingBalance.toFixed(2)),
        payment: parseFloat(payment.toFixed(2)),
        amountTowardInterest: parseFloat(amountTowardInterest.toFixed(2)),
        amountTowardPrincipal: parseFloat(amountTowardPrincipal.toFixed(2)),
        endingBalance: parseFloat(endingBalance.toFixed(2)),
        loanToValue,
        loanToValuePercentage,
        equityValue: parseFloat(equityValue.toFixed(2)),
        equityPercentage,
      });

      balance = endingBalance;

      // If the loan is paid off, exit the loop
      if (balance <= 0.01) break;
    }

    return schedule;
  }

  /**
   * Calculates the total extra payments applicable for a given month.
   */
  private calculateExtraPaymentsForMonth(month: number): number {
    return this.extraPayments
      .filter((extraPayment) => month >= extraPayment.startMonth)
      .reduce((total, extraPayment) => total + extraPayment.extraAmount, 0);
  }

  /**
   * Calculates loan-to-value and equity metrics.
   */
  private calculateEquityMetrics(endingBalance: number) {
    const loanToValue = parseFloat(
      (endingBalance / this.assetValue).toFixed(4)
    );
    const loanToValuePercentage = parseFloat((loanToValue * 100).toFixed(2));
    const equityValue = this.assetValue - endingBalance;
    const equityPercentage = parseFloat(
      ((equityValue / this.assetValue) * 100).toFixed(2)
    );

    return {
      loanToValue,
      loanToValuePercentage,
      equityValue,
      equityPercentage,
    };
  }

  /**
   * Displays a summary of the loan details.
   */
  displaySummary(): void {
    console.log(`Asset Value: $${this.assetValue.toLocaleString()}`);
    console.log(
      `Down Payment (${
        this.percentagePutDown
      }%): $${this.downPayment.toLocaleString()}`
    );
    console.log(`Loan Amount: $${this.loanAmount.toLocaleString()}`);
    console.log(`Annual Interest Rate: ${this.interestRate}%`);
    console.log(`Loan Term: ${this.termInYears} years`);
    console.log(`Monthly Payment: $${this.minimumPayment.toLocaleString()}\n`);
  }

  /**
   * Calculates summary statistics for a loan schedule
   *
   * @param schedule - The loan schedule to calculate statistics for
   * @returns Summary statistics for the loan schedule
   */
  calculateSummaryStats(schedule: Statement[]): SummaryStats {
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
  }

  /**
   * Displays the first N months of a loan schedule
   *
   * @param title - The title to display above the table
   * @param data - The loan schedule data
   * @param count - The number of months to display
   */
  displayFirstMonths(title: string, data: Statement[], count: number): void {
    console.log(`\n${title}:`);
    console.table(data.slice(0, count));
  }

  /**
   * Displays the last N months of a loan schedule
   *
   * @param title - The title to display above the table
   * @param data - The loan schedule data
   * @param count - The number of months to display
   */
  displayLastMonths(title: string, data: Statement[], count: number): void {
    console.log(`\n${title}:`);
    console.table(data.slice(-count));
  }

  /**
   * Displays summary statistics for a loan schedule
   *
   * @param title - The title to display above the statistics
   * @param stats - The summary statistics to display
   */
  displaySummaryStats(title: string, stats: SummaryStats): void {
    console.log(`\n${title}:`);
    console.log(`  Total Payments: $${stats.totalPayments.toLocaleString()}`);
    console.log(`  Total Interest: $${stats.totalInterest.toLocaleString()}`);
    console.log(`  Total Principal: $${stats.totalPrincipal.toLocaleString()}`);
    console.log(`  Months to Payoff: ${stats.monthsToPayoff}`);
  }

  /**
   * Displays savings from extra payments
   *
   * @param standardStats - Statistics for the standard loan schedule
   * @param adjustedStats - Statistics for the adjusted loan schedule with extra payments
   */
  displaySavings(
    standardStats: SummaryStats,
    adjustedStats: SummaryStats
  ): void {
    const interestSavings =
      standardStats.totalInterest - adjustedStats.totalInterest;
    const monthsSaved =
      standardStats.monthsToPayoff - adjustedStats.monthsToPayoff;

    console.log("\nSavings from Extra Payments:");
    console.log(`  Interest Saved: $${interestSavings.toLocaleString()}`);
    console.log(`  Months Saved: ${monthsSaved}`);
  }

  /**
   * Displays information about the current position in the loan lifecycle
   *
   * @param loanStartDate - The date the loan started
   * @param currentDate - The current date
   */
  displayCurrentPosition(loanStartDate: Date, currentDate: Date): void {
    const position = this.findPositionByDate(loanStartDate, currentDate);

    console.log("\nCurrent Position in Loan Lifecycle:");
    console.log(
      `  Current Balance: $${position.currentBalance.toLocaleString()}`
    );
    console.log(`  Current Month: ${position.currentMonth}`);
    console.log(`  Months Elapsed: ${position.monthsElapsed}`);
    console.log(`  Months Remaining: ${position.monthsRemaining}`);
    console.log(`  Years Remaining: ${position.yearsRemaining.toFixed(1)}`);
    console.log(
      `  Percentage Complete: ${position.percentageComplete.toFixed(1)}%`
    );
    console.log(
      `  Percentage Remaining: ${position.percentageRemaining.toFixed(1)}%`
    );

    if (position.statement) {
      console.log("\nCurrent Month Details:");
      console.log(
        `  Starting Balance: $${position.statement.startingBalance.toLocaleString()}`
      );
      console.log(`  Payment: $${position.statement.payment.toLocaleString()}`);
      console.log(
        `  Toward Principal: $${position.statement.amountTowardPrincipal.toLocaleString()}`
      );
      console.log(
        `  Toward Interest: $${position.statement.amountTowardInterest.toLocaleString()}`
      );
      console.log(
        `  Ending Balance: $${position.statement.endingBalance.toLocaleString()}`
      );
      console.log(
        `  Loan-to-Value: ${position.statement.loanToValuePercentage.toFixed(
          2
        )}%`
      );
      console.log(
        `  Equity: $${position.statement.equityValue.toLocaleString()} (${position.statement.equityPercentage.toFixed(
          2
        )}%)`
      );
    }
  }

  /**
   * Runs a complete loan analysis and displays all relevant information
   *
   * @param extraPayments - Array of extra payments to apply to the loan
   * @param loanStartDate - The date the loan started
   * @param currentDate - The current date
   */
  runLoanAnalysis(
    extraPayments: ExtraPayment[],
    loanStartDate: Date,
    currentDate: Date
  ): void {
    // Generate standard schedule
    const standardSchedule = this.generateSchedule();

    // Apply extra payments and generate adjusted schedule
    const loanWithExtraPayments = this.applyExtraPayments(extraPayments);
    const adjustedSchedule = loanWithExtraPayments.generateAdjustedSchedule();

    // Display loan summary
    this.displaySummary();

    // Display first months of both schedules
    this.displayFirstMonths(
      "First 24 Months of Standard Amortization Schedule",
      standardSchedule,
      24
    );
    this.displayFirstMonths(
      "First 24 Months of Adjusted Amortization Schedule",
      adjustedSchedule,
      24
    );

    // Display last months of both schedules
    this.displayLastMonths(
      "Last 3 Months of Standard Amortization Schedule",
      standardSchedule,
      3
    );
    this.displayLastMonths(
      "Last 3 Months of Adjusted Amortization Schedule",
      adjustedSchedule,
      3
    );

    // Calculate and display statistics
    const standardStats = this.calculateSummaryStats(standardSchedule);
    const adjustedStats = this.calculateSummaryStats(adjustedSchedule);

    this.displaySummaryStats(
      "Summary Statistics - Standard Schedule",
      standardStats
    );
    this.displaySummaryStats(
      "Summary Statistics - Adjusted Schedule",
      adjustedStats
    );

    // Display savings
    this.displaySavings(standardStats, adjustedStats);

    // Display current position in loan lifecycle
    loanWithExtraPayments.displayCurrentPosition(loanStartDate, currentDate);
  }

  /**
   * Applies multiple extra payments to the loan schedule
   *
   * @param extraPayments - Array of extra payments to apply
   * @returns A new LoanAmortizationSchedule instance with all extra payments applied
   */
  private applyExtraPayments(
    extraPayments: ExtraPayment[]
  ): LoanAmortizationSchedule {
    let result: LoanAmortizationSchedule = this;
    for (const extra of extraPayments) {
      result = result.addExtraPayment(extra.extraAmount, extra.startMonth);
    }
    return result;
  }

  /**
   * Finds the current position in the loan lifecycle based on dates.
   *
   * @param loanStartDate - The date the loan started
   * @param currentDate - The current date
   * @returns Information about the current position in the loan lifecycle
   */
  findPositionByDate(
    loanStartDate: Date,
    currentDate: Date
  ): {
    currentMonth: number;
    monthsElapsed: number;
    monthsRemaining: number;
    yearsRemaining: number;
    percentageComplete: number;
    percentageRemaining: number;
    statement: Statement | null;
    currentBalance: number;
  } {
    // Generate the schedule to find the position
    const schedule = this.generateAdjustedSchedule();

    // Calculate months elapsed since loan start
    const monthsElapsed = this.calculateMonthsBetween(
      loanStartDate,
      currentDate
    );

    // Ensure monthsElapsed is within the loan term
    const currentMonth = Math.min(monthsElapsed, schedule.length - 1);

    // Get the statement for the current month
    const currentStatement = schedule[currentMonth];

    // Calculate remaining time
    const monthsRemaining = schedule.length - currentMonth;
    const yearsRemaining = monthsRemaining / 12;

    // Calculate percentages
    const percentageComplete = (currentMonth / schedule.length) * 100;
    const percentageRemaining = 100 - percentageComplete;

    return {
      currentMonth: currentMonth + 1, // Convert to 1-based month
      monthsElapsed,
      monthsRemaining,
      yearsRemaining,
      percentageComplete,
      percentageRemaining,
      statement: currentStatement,
      currentBalance: currentStatement
        ? currentStatement.endingBalance
        : this.loanAmount,
    };
  }

  /**
   * Calculates the number of months between two dates
   */
  private calculateMonthsBetween(startDate: Date, endDate: Date): number {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();
    return yearDiff * 12 + monthDiff;
  }
}
