export interface PersonaBehavior {
  name: string; // Unique identifier for the persona
  description: string; // Brief summary of the persona's behavior and what it tests
  tradeFrequency: number; // Probability of making a trade on any given day (0 to 1)
  tradeCompletionRate: number; // Probability that a trade, if attempted, is successful (0 to 1)
  disputeProbability: number; // Probability that any given trade results in a dispute (0 to 1)
  isEmailVerified: boolean; // Whether the user has verified their email
  isPhoneVerified: boolean; // Whether the user has verified their phone
  inactivityPeriods?: { startDay: number; endDay: number }[]; // Optional periods of inactivity (e.g., for seasonal users)
}

/**
 * A comprehensive set of 13 personas designed to test the extremes of the
 * reputation algorithm, including asymmetrical decay and sigmoid sensitivity.
 */
export const MARKETPLACE_PERSONAS: PersonaBehavior[] = [
  {
    name: 'The Extreme Perfect User (Verified)',
    description: 'The Gold Standard. High frequency, near-perfect success.',
    tradeFrequency: 1,
    tradeCompletionRate: 1,
    disputeProbability: 0,
    isEmailVerified: true,
    isPhoneVerified: true,
  },
  {
    name: 'The Perfect User (Verified)',
    description: 'The Gold Standard. High frequency, near-perfect success.',
    tradeFrequency: 0.9,
    tradeCompletionRate: 0.99,
    disputeProbability: 0.0001,
    isEmailVerified: true,
    isPhoneVerified: true,
  },
  {
    name: 'The Perfect User (Unverified)',
    description: 'The Gold Standard. High frequency, near-perfect success.',
    tradeFrequency: 0.9,
    tradeCompletionRate: 0.99,
    disputeProbability: 0.0001,
    isEmailVerified: false,
    isPhoneVerified: false,
  },
  {
    name: 'The Trustworthy Neighbor (Verified Email Only)',
    description:
      'Low volume, high reliability. Tests if low "Engagement" prevents high scores.',
    tradeFrequency: 0.05, // Trades 1-2 times per month
    tradeCompletionRate: 1,
    disputeProbability: 0,
    isEmailVerified: true,
    isPhoneVerified: false,
  },
  {
    name: 'The Low Quality, Active User (Verified Email Only)',
    description:
      'Active but unreliable. 30% failure rate. Should be buried by the steepness of the sigmoid.',
    tradeFrequency: 0.6,
    tradeCompletionRate: 0.7,
    disputeProbability: 0.005,
    isEmailVerified: true,
    isPhoneVerified: false,
  },
  {
    name: 'The Predatory Scammer (Unverified)',
    description:
      'Extreme negative behavior. High dispute rate and low completion.',
    tradeFrequency: 0.5,
    tradeCompletionRate: 0.3,
    disputeProbability: 0.2,
    isEmailVerified: false,
    isPhoneVerified: false,
  },
  {
    name: 'The Disputed Power-User (Verified)',
    description:
      'Successful trades but very problematic. Tests if high penalties can offset high volume.',
    tradeFrequency: 0.8,
    tradeCompletionRate: 0.95,
    disputeProbability: 0.08, // 1 in 12 trades result in a penalty
    isEmailVerified: true,
    isPhoneVerified: true,
  },
  {
    name: 'The Barely-Passing Trader',
    description:
      'Hovers at 55% success. Tests the steepness of the sigmoid at the x0 midpoint.',
    tradeFrequency: 0.4,
    tradeCompletionRate: 0.55,
    disputeProbability: 0.01,
    isEmailVerified: true,
    isPhoneVerified: false,
  },
  {
    name: 'The Seasonal Trader (Verified)',
    description:
      'Works in bursts. Tests if the 90-day Alpha decay preserves their trust during gaps.',
    tradeFrequency: 0.9,
    tradeCompletionRate: 0.97,
    disputeProbability: 0.001,
    isEmailVerified: true,
    isPhoneVerified: true,
    inactivityPeriods: [
      { startDay: 100, endDay: 250 }, // 5 month winter break
      { startDay: 400, endDay: 550 },
    ],
  },
  {
    name: 'The Seasonal Trader (Unverified)',
    description:
      'Works in bursts. Tests if the Alpha decay preserves their trust during gaps.',
    tradeFrequency: 0.9,
    tradeCompletionRate: 0.97,
    disputeProbability: 0.001,
    isEmailVerified: false,
    isPhoneVerified: false,
    inactivityPeriods: [
      { startDay: 100, endDay: 250 }, // 5 month winter break
      { startDay: 400, endDay: 550 },
    ],
  },
  {
    name: 'The Ghost User (Verified)',
    description:
      'Was perfect for a year, then left. Tests regression to priors vs. permanent experience.',
    tradeFrequency: 0.7,
    tradeCompletionRate: 0.99,
    disputeProbability: 0,
    isEmailVerified: true,
    isPhoneVerified: true,
    inactivityPeriods: [{ startDay: 365, endDay: 730 }], // Active Year 1, Gone Year 2
  },
  {
    name: 'The Ghost User (Unverified)',
    description:
      'Was perfect for a year, then left. Tests regression to priors vs. permanent experience.',
    tradeFrequency: 0.7,
    tradeCompletionRate: 0.99,
    disputeProbability: 0,
    isEmailVerified: false,
    isPhoneVerified: false,
    inactivityPeriods: [{ startDay: 365, endDay: 730 }], // Active Year 1, Gone Year 2
  },
  {
    name: 'The High-Volume Noise (Verified Email Only)',
    description:
      'Bot-like frequency but mediocre stats. Tests if Engagement (volume) can "brute force" a good score.',
    tradeFrequency: 1, // Every single day
    tradeCompletionRate: 0.75,
    disputeProbability: 0.02,
    isEmailVerified: true,
    isPhoneVerified: false,
  },
];
