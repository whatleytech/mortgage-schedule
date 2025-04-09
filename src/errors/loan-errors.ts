/**
 * Base class for all loan-related errors
 */
export class LoanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Error thrown when loan parameters fail validation
 */
export class LoanValidationError extends LoanError {
  constructor(message: string, public field: string) {
    super(message);
    this.name = "LoanValidationError";
  }
}

/**
 * Error thrown when attempting to add an invalid extra payment
 */
export class InvalidExtraPaymentError extends LoanError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidExtraPaymentError";
  }
}
