const reputation = () => ({
  reputation: {
    weights: {
      history: 0.6, // Weight of Bayesian performance (Alpha / Alpha + Beta)
      verification: 0.2, // Weight of identity proof (Email/Phone)
      engagement: 0.2, // Weight of transaction volume (Trade Count)
    },
    sigmoid: {
      k: 20, // Steepness: determines how quickly trust is gained/lost
      x0: 0.52, // Midpoint: the raw sum value required to reach a score of 50
    },
    decay: {
      halfLifeDays: 60, // Time in days for parameters to decay by 50%
      penaltyHalfLifeDays: 30, // Penalties vanish twice as fast as rep
      decayTradeCount: false, // Experience is permanent
    },
    priors: {
      alpha: 2, // Neutral success starting point
      beta: 1, // Neutral failure starting point
    },
    penalties: {
      defaultImpact: 0.05, // Impact subtracted from raw sum during a dispute
    },
  },
});
export default reputation;
