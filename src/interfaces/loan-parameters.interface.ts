/**
 * Interface representing the parameters for a loan.
 * Includes validation constraints for each field.
 */
export interface LoanParameters {
  /**
   * The total value of the asset being financed.
   * Must be greater than zero.
   */
  assetValue: number;

  /**
   * The percentage of the asset value provided as a down payment.
   * Must be between 0 and 100.
   */
  percentagePutDown: number;

  /**
   * Annual interest rate in percentage (e.g., 5 for 5%).
   * Must be greater than or equal to zero.
   * Typically between 0 and 30.
   */
  interestRate: number;

  /**
   * The term of the loan in years.
   * Must be greater than zero.
   * Typically between 5 and 30 years.
   */
  termInYears: number;

  /**
   * Optional fixed monthly payment amount.
   * If not provided, calculated based on standard formula.
   * Must be greater than zero if provided.
   */
  minimumPayment?: number;
}

/**
 * Constants for loan parameter validation
 */
export const LOAN_CONSTRAINTS = {
  MAX_TERM_YEARS: 30,
  MIN_TERM_YEARS: 5,
  MAX_INTEREST_RATE: 30,
  MIN_INTEREST_RATE: 0,
  MAX_ASSET_VALUE: 1000000000, // $1 billion
  MIN_ASSET_VALUE: 1000, // $1,000
} as const;
