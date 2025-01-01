export interface Statement {
  month: number;
  startingBalance: number;
  payment: number;
  amountTowardInterest: number;
  amountTowardPrincipal: number;
  endingBalance: number;
  loanToValue: number; // Decimal representation (e.g., 0.80)
  loanToValuePercentage: number; // Percentage representation (e.g., 80.00)
  equityValue: number; // Equity in dollars
  equityPercentage: number; // Equity as a percentage
}