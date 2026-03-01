// src/reputation/interfaces/reputation-config.interface.ts
export interface ReputationConfig {
  weights: {
    history: number;
    verification: number;
    engagement: number;
  };
  sigmoid: {
    k: number;
    x0: number;
  };
}
