export default () => ({
  reputation: {
    weights: {
      history: 0.55,
      verification: 0.35,
      engagement: 0.1,
    },
    sigmoid: {
      k: 10, // Steepness for Progressive Friction
      x0: 0.5, // Midpoint where score is 50
    },
    decay: {
      halfLifeDays: 180, // 6-month half-life
    },
    priors: {
      alpha: 1, // Neutral starting point
      beta: 1,
    },
  },
});
