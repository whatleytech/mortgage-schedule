# Loan Amortization Calculator

A TypeScript library for calculating loan amortization schedules with support for extra payments.

## Features

- Calculate standard loan amortization schedules
- Add extra payments to reduce loan term and interest
- Calculate loan-to-value (LTV) and equity metrics
- Immutable API design for predictable behavior
- Comprehensive validation and error handling
- Well-documented with TypeScript interfaces

## Installation

```bash
npm install loan-amortization-calculator
```

## Usage

### Basic Usage

```typescript
import { LoanAmortizationSchedule } from 'loan-amortization-calculator';

// Create a new loan schedule
const loan = new LoanAmortizationSchedule({
  assetValue: 300000,        // $300,000 home
  percentagePutDown: 20,     // 20% down payment
  interestRate: 5,           // 5% annual interest rate
  termInYears: 30            // 30-year fixed rate mortgage
});

// Generate a standard amortization schedule
const schedule = loan.generateSchedule();

// Display loan summary
loan.displaySummary();
```

### Adding Extra Payments

```typescript
// Add an extra payment of $100 starting from month 12
const loanWithExtraPayment = loan.addExtraPayment(100, 12);

// Generate an adjusted schedule with the extra payment
const adjustedSchedule = loanWithExtraPayment.generateAdjustedSchedule();
```

## Loan Amortization Concepts

### What is Loan Amortization?

Loan amortization is the process of paying off a debt over time through regular payments. Each payment consists of two parts:

1. **Principal**: The original loan amount that needs to be repaid
2. **Interest**: The cost of borrowing money, calculated as a percentage of the remaining balance

### How Amortization Works

In a standard amortization schedule:

- The monthly payment remains constant throughout the loan term
- Early payments are mostly interest, with a small portion going to principal
- As the loan balance decreases, more of each payment goes toward principal
- The final payment pays off the remaining balance

### The Amortization Formula

The monthly payment is calculated using the following formula:

```
P = L[r(1+r)^n]/[(1+r)^n-1]
```

Where:
- P = Monthly payment
- L = Loan amount
- r = Monthly interest rate (annual rate / 12)
- n = Total number of payments (years * 12)

### Extra Payments

Making extra payments toward the principal:

- Reduces the total interest paid over the life of the loan
- Shortens the loan term
- Builds equity faster
- Can be scheduled to start at any point in the loan term

### Loan-to-Value (LTV) Ratio

The LTV ratio is the percentage of the property value that is financed:

```
LTV = Loan Amount / Property Value
```

A lower LTV ratio:
- May qualify for better interest rates
- Reduces the risk of being "underwater" on the loan
- May eliminate the need for private mortgage insurance (PMI)

## API Reference

### LoanAmortizationSchedule

#### Constructor

```typescript
constructor(params: LoanParameters)
```

Creates a new loan amortization schedule.

#### Methods

- `addExtraPayment(extraAmount: number, startMonth: number): LoanAmortizationSchedule`
- `generateSchedule(): Statement[]`
- `generateAdjustedSchedule(): Statement[]`
- `displaySummary(): void`

### Interfaces

#### LoanParameters

```typescript
interface LoanParameters {
  assetValue: number;
  percentagePutDown: number;
  interestRate: number;
  termInYears: number;
  minimumPayment?: number;
}
```

#### Statement

```typescript
interface Statement {
  month: number;
  startingBalance: number;
  payment: number;
  amountTowardInterest: number;
  amountTowardPrincipal: number;
  endingBalance: number;
  loanToValue: number;
  loanToValuePercentage: number;
  equityValue: number;
  equityPercentage: number;
}
```

## License

MIT 