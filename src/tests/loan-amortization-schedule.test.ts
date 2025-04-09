import { LoanAmortizationSchedule } from "../classes/loan-amortization-schedule";
import {
  LoanValidationError,
  NoExtraPaymentsError,
  InvalidExtraPaymentError,
} from "../errors/loan-errors";
import { LOAN_CONSTRAINTS } from "../interfaces/loan-parameters.interface";

describe("LoanAmortizationSchedule", () => {
  // Test data
  const validLoanParams = {
    assetValue: 300000,
    percentagePutDown: 20,
    interestRate: 5,
    termInYears: 30,
  };

  describe("Constructor", () => {
    it("should create a valid loan schedule with default parameters", () => {
      const loan = new LoanAmortizationSchedule(validLoanParams);
      expect(loan).toBeInstanceOf(LoanAmortizationSchedule);
    });

    it("should create a valid loan schedule with custom minimum payment", () => {
      const params = { ...validLoanParams, minimumPayment: 1500 };
      const loan = new LoanAmortizationSchedule(params);
      expect(loan).toBeInstanceOf(LoanAmortizationSchedule);
    });

    it("should throw LoanValidationError for invalid asset value", () => {
      const params = { ...validLoanParams, assetValue: 0 };
      expect(() => new LoanAmortizationSchedule(params)).toThrow(
        LoanValidationError
      );
    });

    it("should throw LoanValidationError for invalid percentage put down", () => {
      const params = { ...validLoanParams, percentagePutDown: 101 };
      expect(() => new LoanAmortizationSchedule(params)).toThrow(
        LoanValidationError
      );
    });

    it("should throw LoanValidationError for invalid interest rate", () => {
      const params = { ...validLoanParams, interestRate: -1 };
      expect(() => new LoanAmortizationSchedule(params)).toThrow(
        LoanValidationError
      );
    });

    it("should throw LoanValidationError for invalid term in years", () => {
      const params = { ...validLoanParams, termInYears: 0 };
      expect(() => new LoanAmortizationSchedule(params)).toThrow(
        LoanValidationError
      );
    });

    it("should throw LoanValidationError for invalid minimum payment", () => {
      const params = { ...validLoanParams, minimumPayment: 0 };
      expect(() => new LoanAmortizationSchedule(params)).toThrow(
        LoanValidationError
      );
    });
  });

  describe("addExtraPayment", () => {
    it("should return a new instance with the extra payment added", () => {
      const loan = new LoanAmortizationSchedule(validLoanParams);
      const loanWithExtraPayment = loan.addExtraPayment(100, 12);

      expect(loanWithExtraPayment).toBeInstanceOf(LoanAmortizationSchedule);
      expect(loanWithExtraPayment).not.toBe(loan); // Should be a new instance
    });

    it("should throw InvalidExtraPaymentError for invalid extra amount", () => {
      const loan = new LoanAmortizationSchedule(validLoanParams);
      expect(() => loan.addExtraPayment(0, 12)).toThrow(
        InvalidExtraPaymentError
      );
    });

    it("should throw InvalidExtraPaymentError for invalid start month", () => {
      const loan = new LoanAmortizationSchedule(validLoanParams);
      expect(() => loan.addExtraPayment(100, 0)).toThrow(
        InvalidExtraPaymentError
      );
    });
  });

  describe("generateSchedule", () => {
    it("should generate a valid amortization schedule", () => {
      const loan = new LoanAmortizationSchedule(validLoanParams);
      const schedule = loan.generateSchedule();

      expect(schedule).toBeInstanceOf(Array);
      expect(schedule.length).toBeGreaterThan(0);

      // Check the first payment
      const firstPayment = schedule[0];
      expect(firstPayment.month).toBe(1);
      expect(firstPayment.startingBalance).toBe(
        validLoanParams.assetValue *
          (1 - validLoanParams.percentagePutDown / 100)
      );
      expect(firstPayment.payment).toBeGreaterThan(0);
      expect(firstPayment.amountTowardInterest).toBeGreaterThan(0);
      expect(firstPayment.amountTowardPrincipal).toBeGreaterThan(0);
      expect(firstPayment.endingBalance).toBeLessThan(
        firstPayment.startingBalance
      );
    });

    it("should have the correct number of payments", () => {
      const loan = new LoanAmortizationSchedule(validLoanParams);
      const schedule = loan.generateSchedule();

      // For a 30-year loan, there should be 360 payments (or fewer if paid off early)
      expect(schedule.length).toBeLessThanOrEqual(
        validLoanParams.termInYears * 12
      );
    });

    it("should have a zero ending balance in the last payment", () => {
      const loan = new LoanAmortizationSchedule(validLoanParams);
      const schedule = loan.generateSchedule();
      const lastPayment = schedule[schedule.length - 1];

      expect(lastPayment.endingBalance).toBe(0);
    });
  });

  describe("generateAdjustedSchedule", () => {
    it("should throw NoExtraPaymentsError when no extra payments are added", () => {
      const loan = new LoanAmortizationSchedule(validLoanParams);
      expect(() => loan.generateAdjustedSchedule()).toThrow(
        NoExtraPaymentsError
      );
    });

    it("should generate a valid adjusted schedule with extra payments", () => {
      const loan = new LoanAmortizationSchedule(validLoanParams);
      const loanWithExtraPayment = loan.addExtraPayment(100, 12);
      const schedule = loanWithExtraPayment.generateAdjustedSchedule();

      expect(schedule).toBeInstanceOf(Array);
      expect(schedule.length).toBeGreaterThan(0);

      // Check that payments after month 12 include the extra payment
      const paymentAfterExtra = schedule.find((p) => p.month === 13);
      expect(paymentAfterExtra).toBeDefined();
      expect((paymentAfterExtra as any).payment).toBeGreaterThan(
        loan.generateSchedule()[12].payment
      );
    });

    it("should have fewer payments than the standard schedule when extra payments are made", () => {
      const loan = new LoanAmortizationSchedule(validLoanParams);
      const standardSchedule = loan.generateSchedule();
      const loanWithExtraPayment = loan.addExtraPayment(500, 1);
      const adjustedSchedule = loanWithExtraPayment.generateAdjustedSchedule();

      expect(adjustedSchedule.length).toBeLessThan(standardSchedule.length);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero interest rate correctly", () => {
      const params = { ...validLoanParams, interestRate: 0 };
      const loan = new LoanAmortizationSchedule(params);
      const schedule = loan.generateSchedule();

      // With 0% interest, all payments should go to principal
      const firstPayment = schedule[0];
      expect(firstPayment.amountTowardInterest).toBe(0);
      expect(firstPayment.amountTowardPrincipal).toBe(firstPayment.payment);
    });

    it("should handle very small down payments", () => {
      const params = { ...validLoanParams, percentagePutDown: 0.1 };
      const loan = new LoanAmortizationSchedule(params);
      const schedule = loan.generateSchedule();

      expect(schedule[0].startingBalance).toBeCloseTo(
        validLoanParams.assetValue * 0.999,
        2
      );
    });

    it("should handle very large down payments", () => {
      const params = { ...validLoanParams, percentagePutDown: 99.9 };
      const loan = new LoanAmortizationSchedule(params);
      const schedule = loan.generateSchedule();

      expect(schedule[0].startingBalance).toBeCloseTo(
        validLoanParams.assetValue * 0.001,
        2
      );
    });
  });
});
