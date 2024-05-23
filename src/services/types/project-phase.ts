export enum Phase {
  Rejected, // 0
  Pending, // 1
  DealFlow, // 2
  Analysis, // 3
  InvestmentCommittee, // 4
  Refunded, // 5
  Portfolio // 6
}

export function mapProjectPhase(phase: number): string {
  // if (phase === Phase.Rejected) return 'Rejected'
  // else if (phase === Phase.Pending) return 'Pending'
  if (phase === Phase.DealFlow) return 'Deal Flow';
  else if (phase === Phase.Analysis) return 'Analysis';
  else if (phase === Phase.InvestmentCommittee) return 'Investment Committee';
  else if (phase === Phase.Refunded) return 'Refunded';
  else if (phase === Phase.Portfolio) return 'Portfolio';

  throw new Error("Invalid phase"); // Rejected and Pending should be filtered out
}
