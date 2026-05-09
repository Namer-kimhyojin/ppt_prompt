(function () {
  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function createGenerationQueue({ worker, onUpdate, onDone }) {
    const state = {
      jobs: [],
      status: "idle",
      stopRequested: false,
      delayMs: 10000,
      maxRetries: 1,
    };

    function snapshot() {
      return {
        status: state.status,
        delayMs: state.delayMs,
        maxRetries: state.maxRetries,
        jobs: state.jobs.map((job) => ({ ...job })),
      };
    }

    function emit() {
      if (typeof onUpdate === "function") onUpdate(snapshot());
    }

    function setJobs(jobs) {
      state.jobs = jobs.map((job, index) => ({
        ...job,
        queueIndex: index,
        status: "pending",
        attempts: 0,
        imageUrl: "",
        filename: "",
        error: "",
      }));
      state.status = "idle";
      state.stopRequested = false;
      emit();
    }

    async function waitIfPaused() {
      while (state.status === "paused" && !state.stopRequested) {
        await sleep(250);
      }
    }

    async function run(options = {}) {
      if (state.status === "running") return;
      state.delayMs = Number(options.delayMs ?? state.delayMs) || 0;
      state.maxRetries = Number(options.maxRetries ?? state.maxRetries) || 0;
      state.status = "running";
      state.stopRequested = false;
      emit();

      for (const job of state.jobs) {
        if (state.stopRequested) break;
        if (job.status === "done") continue;

        await waitIfPaused();
        if (state.stopRequested) break;

        job.status = "running";
        job.error = "";
        emit();

        let done = false;
        while (!done && job.attempts <= state.maxRetries && !state.stopRequested) {
          job.attempts += 1;
          try {
            const result = await worker(job);
            job.status = "done";
            job.imageUrl = result.url || "";
            job.filename = result.filename || "";
            done = true;
          } catch (error) {
            job.error = error?.message || "Generation failed.";
            if (job.attempts > state.maxRetries) {
              job.status = "failed";
              done = true;
            }
          }
          emit();
        }

        if (!state.stopRequested && state.delayMs > 0) {
          await sleep(state.delayMs);
        }
      }

      state.status = state.stopRequested ? "idle" : "done";
      state.stopRequested = false;
      emit();
      if (typeof onDone === "function") onDone(snapshot());
    }

    function pause() {
      if (state.status !== "running") return;
      state.status = "paused";
      emit();
    }

    function resume() {
      if (state.status !== "paused") return;
      state.status = "running";
      emit();
    }

    function stop() {
      state.stopRequested = true;
      if (state.status === "paused") state.status = "running";
      emit();
    }

    return {
      setJobs,
      run,
      pause,
      resume,
      stop,
      snapshot,
    };
  }

  window.PromptDeckGenerationQueue = { createGenerationQueue };
})();

