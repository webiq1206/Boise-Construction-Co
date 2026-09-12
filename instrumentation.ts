export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    // Ordinary startup must never repair customer data without human review.
    void import("./lib/p5/backgroundJobs")
      .then((m) => m.bootEstimatorWorker())
      .catch(() =>
        console.error(
          "[p5-worker] Startup deferred; estimator requests can resume saved work.",
        ),
      );
  }
}
