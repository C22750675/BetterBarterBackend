import { PersonaBehavior } from '../reputation-simulator.service';

/**
 * A comprehensive set of 10 personas designed to test the extremes of the
 * reputation algorithm, including asymmetrical decay and sigmoid sensitivity.
 */
export const MARKETPLACE_PERSONAS: PersonaBehavior[] = [
  {
    name: 'The Perfect User',
    description: 'The Gold Standard. High frequency, near-perfect success.',
    tradeFrequency: 0.9,
    tradeCompletionRate: 0.99,
    disputeProbability: 0.0001,
  },
  {
    name: 'The Trustworthy Neighbor',
    description:
      'Low volume, high reliability. Tests if low "Engagement" prevents high scores.',
    tradeFrequency: 0.05, // Monthly activity
    tradeCompletionRate: 1,
    disputeProbability: 0,
  },
  {
    name: 'The Low Quality, Active User',
    description:
      'Active but unreliable. 30% failure rate. Should be buried by the k=20 sigmoid.',
    tradeFrequency: 0.6,
    tradeCompletionRate: 0.7,
    disputeProbability: 0.005,
  },
  {
    name: 'The Predatory Scammer',
    description:
      'Extreme negative behavior. High dispute rate and low completion.',
    tradeFrequency: 0.5,
    tradeCompletionRate: 0.3,
    disputeProbability: 0.2,
  },
  {
    name: 'The Litigious Power-User',
    description:
      'Successful trades but very problematic. Tests if high penalties can offset high volume.',
    tradeFrequency: 0.8,
    tradeCompletionRate: 0.95,
    disputeProbability: 0.08, // 1 in 12 trades result in a penalty
  },
  {
    name: 'The Barely-Passing Trader',
    description:
      'Hovers at 55% success. Tests the steepness of the sigmoid at the x0 midpoint.',
    tradeFrequency: 0.4,
    tradeCompletionRate: 0.55,
    disputeProbability: 0.01,
  },
  {
    name: 'The Seasonal Artisan',
    description:
      'Works in bursts. Tests if the 90-day Alpha decay preserves their trust during gaps.',
    tradeFrequency: 0.9,
    tradeCompletionRate: 0.97,
    disputeProbability: 0.002,
    inactivityPeriods: [
      { startDay: 100, endDay: 250 }, // 5 month winter break
      { startDay: 400, endDay: 550 },
    ],
  },
  {
    name: 'The Ghost User',
    description:
      'Was perfect for a year, then left. Tests regression to priors vs. permanent experience.',
    tradeFrequency: 0.7,
    tradeCompletionRate: 0.99,
    disputeProbability: 0,
    inactivityPeriods: [{ startDay: 365, endDay: 730 }], // Active Year 1, Gone Year 2
  },
  {
    name: 'The High-Volume Noise',
    description:
      'Bot-like frequency but mediocre stats. Tests if Engagement (volume) can "brute force" a good score.',
    tradeFrequency: 1, // Every single day
    tradeCompletionRate: 0.75,
    disputeProbability: 0.02,
  },
];
