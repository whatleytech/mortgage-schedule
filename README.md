# Loan Amortization Calculator

A TypeScript library for calculating loan amortization schedules with support for extra payments.

## Features

- Calculate standard loan amortization schedules
- Add extra payments to reduce loan term and interest
- Calculate loan-to-value (LTV) and equity metrics
- Immutable API design for predictable behavior
- Comprehensive validation and error handling
- Well-documented with TypeScript interfaces

## Getting Started

### Prerequisites

- [NVM (Node Version Manager)](https://github.com/nvm-sh/nvm) - For managing Node.js versions
- Node.js v20 (automatically installed via NVM)
- npm or yarn

### Running the Program

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd loan-amortization-calculator
   ```

2. Install and use the correct Node.js version with NVM:
   ```bash
   nvm install
   nvm use
   ```
   This will automatically use Node.js v20 as specified in the `.nvmrc` file.

3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

4. Build the project:
   ```bash
   npm run build
   # or
   yarn build
   ```

5. Run the program:
   ```bash
   npm start
   # or
   yarn start
   ```

6. To run tests:
   ```bash
   npm test
   # or
   yarn test
   ```

## Usage

### Basic Usage

```typescript
import { LoanAmortizationSchedule } from './src/classes/loan-amortization-schedule';

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

### Working with Amortization Schedules

```typescript
// Generate a standard schedule
const standardSchedule = loan.generateSchedule();

// Calculate summary statistics
const standardStats = loan.calculateSummaryStats(standardSchedule);

// Display the first 24 months of the schedule
loan.displayFirstMonths("First 24 Months", standardSchedule, 24);

// Display the last 3 months of the schedule
loan.displayLastMonths("Last 3 Months", standardSchedule, 3);

// Display summary statistics
loan.displaySummaryStats("Standard Schedule Statistics", standardStats);
```

### Comparing Standard vs. Adjusted Schedules

```typescript
// Generate both schedules
const standardSchedule = loan.generateSchedule();
const adjustedSchedule = loanWithExtraPayment.generateAdjustedSchedule();

// Calculate statistics for both
const standardStats = loan.calculateSummaryStats(standardSchedule);
const adjustedStats = loanWithExtraPayment.calculateSummaryStats(adjustedSchedule);

// Display savings from extra payments
loan.displaySavings(standardStats, adjustedStats);
```

### Tracking Loan Position Over Time

```typescript
// Define loan start date and current date
const loanStartDate = new Date('2023-01-01');
const currentDate = new Date('2025-06-15');

// Find current position in loan lifecycle
const position = loan.findPositionByDate(loanStartDate, currentDate);

// Display current position
loan.displayCurrentPosition(loanStartDate, currentDate);
```

### Running a Complete Loan Analysis

```typescript
// Define extra payments
const extraPayments = [
  { extraAmount: 100, startMonth: 12 },
  { extraAmount: 200, startMonth: 24 }
];

// Define loan start date and current date
const loanStartDate = new Date('2023-01-01');
const currentDate = new Date('2025-06-15');

// Run a complete analysis
loan.runLoanAnalysis(extraPayments, loanStartDate, currentDate);
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
- `calculateSummaryStats(schedule: Statement[]): SummaryStats`
- `displayFirstMonths(title: string, data: Statement[], count: number): void`
- `displayLastMonths(title: string, data: Statement[], count: number): void`
- `displaySummaryStats(title: string, stats: SummaryStats): void`
- `displaySavings(standardStats: SummaryStats, adjustedStats: SummaryStats): void`
- `findPositionByDate(loanStartDate: Date, currentDate: Date): PositionInfo`
- `displayCurrentPosition(loanStartDate: Date, currentDate: Date): void`
- `runLoanAnalysis(extraPayments: ExtraPayment[], loanStartDate: Date, currentDate: Date): void`

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

#### SummaryStats

```typescript
interface SummaryStats {
  totalPayments: number;
  totalInterest: number;
  totalPrincipal: number;
  monthsToPayoff: number;
}
```

#### ExtraPayment

```typescript
interface ExtraPayment {
  extraAmount: number;
  startMonth: number;
}
```

#### PositionInfo

```typescript
interface PositionInfo {
  currentMonth: number;
  monthsElapsed: number;
  monthsRemaining: number;
  yearsRemaining: number;
  percentageComplete: number;
  percentageRemaining: number;
  statement: Statement | null;
  currentBalance: number;
}
```
