const reputation = () => ({
  reputation: {
    weights: {
      history: 0.55, // Weight of Bayesian performance (Alpha / Alpha + Beta)
      verification: 0.3, // Weight of identity proof (Email/Phone)
      engagement: 0.15, // Weight of transaction volume (Trade Count)
    },
    sigmoid: {
      k: 10, // Steepness: determines how quickly trust is gained/lost
      x0: 0.6, // Midpoint: the raw sum value required to reach a score of 50
    },
    decay: {
      alphaHalfLifeDays: 30, // Half-life for successes
      betaHalfLifeDays: 60, // Half-life for failures
      penaltyHalfLifeDays: 90, // Time in days for penalties to decay by 50%
      decayTradeCount: false, // Experience is permanent
    },
    priors: {
      alpha: 2, // Neutral success starting point
      beta: 1, // Neutral failure starting point
    },
    penalties: {
      severities: {
        none: 0,
        low: 0.05,
        medium: 0.1,
        high: 0.25,
      },
    },
  },
});

export type ReputationConfig = ReturnType<typeof reputation>['reputation'];

export default reputation;
