const reputation = () => ({
  reputation: {
    weights: {
      history: 0.55, // Weight of Bayesian performance (Alpha/Beta)
      verification: 0.35, // Weight of identity proof (Email/Phone)
      engagement: 0.1, // Weight of transaction volume (Trade Count)
    },
    sigmoid: {
      k: 15, // Steepness: determines how quickly trust is gained/lost
      x0: 0.65, // Midpoint: the raw sum value required to reach a score of 50
    },
    decay: {
      halfLifeDays: 180, // Time in days for parameters to decay by 50%
    },
    priors: {
      alpha: 1, // Neutral success starting point
      beta: 1, // Neutral failure starting point
    },
    penalties: {
      defaultImpact: 0.1, // Impact subtracted from raw sum during a dispute
    },
  },
});
export default reputation;
