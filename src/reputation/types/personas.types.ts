import { PersonaBehavior } from '../reputation-simulator.service';

export const MARKETPLACE_PERSONAS: PersonaBehavior[] = [
  {
    name: 'The Power User',
    description:
      'High volume, professional trader with near-perfect execution.',
    tradeFrequency: 0.95, // Trades almost every day
    tradeCompletionRate: 0.99,
    disputeProbability: 0.0005,
  },
  {
    name: 'The Casual Buyer',
    description:
      'Low volume, reliable participant. Tests how the system handles sparse data.',
    tradeFrequency: 0.05, // Trades once every 20 days on average
    tradeCompletionRate: 0.98,
    disputeProbability: 0.005,
  },
  {
    name: 'The Seasonal Merchant',
    description:
      'Highly active in bursts, followed by long periods of inactivity to test decay.',
    tradeFrequency: 0.8,
    tradeCompletionRate: 0.95,
    disputeProbability: 0.005,
    inactivityPeriods: [
      { startDay: 60, endDay: 150 }, // Away for 3 months
      { startDay: 210, endDay: 300 }, // Away for another 3 months
    ],
  },
  {
    name: 'The Unreliable Flake',
    description:
      'Frequent activity but high failure rate. Tests the Beta parameter (failures).',
    tradeFrequency: 0.6,
    tradeCompletionRate: 0.7, // 30% failure rate
    disputeProbability: 0.01,
  },
  {
    name: 'The High-Risk Scammer',
    description:
      'Aggressive trading with high dispute rates. Should result in a rapid score collapse.',
    tradeFrequency: 0.7,
    tradeCompletionRate: 0.4,
    disputeProbability: 0.25, // 1 in 4 trades result in a penalty
  },
  {
    name: 'The Deteriorating Legend',
    description:
      'Starts perfect, then disappears. Tests if decay correctly pulls scores toward neutral.',
    tradeFrequency: 0.9,
    tradeCompletionRate: 0.99,
    disputeProbability: 0.0005,
    inactivityPeriods: [{ startDay: 90, endDay: 730 }], // Active for 3 months, then gone for 2 years
  },
  {
    name: 'The Dispute Magnet',
    description:
      'Completes trades but is highly litigious or problematic, triggering penalties.',
    tradeFrequency: 0.5,
    tradeCompletionRate: 0.95,
    disputeProbability: 0.05, // High penalty rate despite successful completions
  },
  {
    name: 'The "Exit Scammer" Proxy',
    description:
      'Mid-range activity with high volatility. Tests the sigmoid midpoint sensitivity.',
    tradeFrequency: 0.4,
    tradeCompletionRate: 0.5,
    disputeProbability: 0.05,
  },
];
