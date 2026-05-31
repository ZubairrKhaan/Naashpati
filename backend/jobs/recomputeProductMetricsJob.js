import { recomputeRollingMetricsAndScores } from "../services/bestsellerService.js";

let intervalRef = null;

const getIntervalMs = () => {
  const parsed = Number(process.env.BESTSELLER_RECOMPUTE_INTERVAL_MS);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 15 * 60 * 1000;
};

export const runMetricsRecomputeJob = async () => {
  try {
    await recomputeRollingMetricsAndScores();
  } catch (error) {
    console.error("[BestsellerJob] recompute failed:", error.message);
  }
};

export const startMetricsRecomputeJob = () => {
  if (intervalRef || (process.env.NODE_ENV || "").toLowerCase() === "test") {
    return;
  }

  intervalRef = setInterval(() => {
    runMetricsRecomputeJob();
  }, getIntervalMs());

  runMetricsRecomputeJob();
};

export const stopMetricsRecomputeJob = () => {
  if (!intervalRef) {
    return;
  }

  clearInterval(intervalRef);
  intervalRef = null;
};
