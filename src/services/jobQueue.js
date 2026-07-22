const logger = require("../utils/logger");
const jobStore = require("./jobStore");

const DEFAULT_CONCURRENCY = Number.parseInt(process.env.SCRAPE_CONCURRENCY, 10) || 1;
const DEFAULT_RETRIES = Number.parseInt(process.env.SCRAPE_RETRIES, 10) || 2;
const DEFAULT_RETRY_DELAY_MS =
  Number.parseInt(process.env.SCRAPE_RETRY_DELAY_MS, 10) || 1000;

let nextJobId = 1;
const jobs = new Map();
const queue = [];
let activeCount = 0;
let configuredConcurrency = DEFAULT_CONCURRENCY;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createJobRecord = ({ type, meta }) => {
  const id = `job_${Date.now()}_${nextJobId++}`;
  const job = {
    id,
    type,
    meta,
    status: "queued",
    attempts: 0,
    createdAt: new Date().toISOString(),
    startedAt: null,
    finishedAt: null,
    error: null,
  };

  jobs.set(id, job);
  jobStore.upsertJob(job).catch((error) => {
    logger.error("job.persist_create_failed", {
      jobId: id,
      error: error.message,
    });
  });
  return job;
};

const runWithRetry = async (task, retries) => {
  let lastError;

  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    try {
      return await task({ attempt });
    } catch (error) {
      lastError = error;
      if (attempt <= retries) {
        const backoffMs = DEFAULT_RETRY_DELAY_MS * attempt;
        logger.warn("job.retry", {
          attempt,
          backoffMs,
          error: error.message,
        });
        await delay(backoffMs);
      }
    }
  }

  throw lastError;
};

const processQueue = async () => {
  if (activeCount >= configuredConcurrency) {
    return;
  }

  const next = queue.shift();
  if (!next) {
    return;
  }

  activeCount += 1;
  const { job, task, resolve, reject, retries } = next;
  job.status = "running";
  job.startedAt = new Date().toISOString();
  jobs.set(job.id, job);
  jobStore.upsertJob(job).catch((error) => {
    logger.error("job.persist_start_failed", {
      jobId: job.id,
      error: error.message,
    });
  });

  logger.info("job.started", {
    jobId: job.id,
    type: job.type,
    meta: job.meta,
  });

  try {
    job.attempts = 0;
    const result = await runWithRetry(async ({ attempt }) => {
      job.attempts = attempt;
      return task({ job, attempt });
    }, retries);

    job.status = "completed";
    job.finishedAt = new Date().toISOString();
    jobs.set(job.id, job);
    jobStore.upsertJob(job).catch((error) => {
      logger.error("job.persist_complete_failed", {
        jobId: job.id,
        error: error.message,
      });
    });
    logger.info("job.completed", { jobId: job.id, type: job.type });
    resolve({ job, result });
  } catch (error) {
    job.status = "failed";
    job.finishedAt = new Date().toISOString();
    job.error = error.message;
    jobs.set(job.id, job);
    jobStore.upsertJob(job).catch((persistError) => {
      logger.error("job.persist_failed", {
        jobId: job.id,
        error: persistError.message,
      });
    });
    logger.error("job.failed", {
      jobId: job.id,
      type: job.type,
      error: error.message,
    });
    reject(error);
  } finally {
    activeCount -= 1;
    processQueue().catch((error) => {
      logger.error("job.queue_error", { error: error.message });
    });
  }
};

const enqueue = ({ type, meta = {}, task, retries = DEFAULT_RETRIES }) => {
  const job = createJobRecord({ type, meta });

  return new Promise((resolve, reject) => {
    queue.push({ job, task, resolve, reject, retries });
    processQueue().catch((error) => {
      logger.error("job.enqueue_error", { error: error.message });
      reject(error);
    });
  });
};

const listJobs = () => Array.from(jobs.values()).sort((a, b) => {
  return new Date(b.createdAt) - new Date(a.createdAt);
});

const getJob = (jobId) => jobs.get(jobId) || null;

const setConcurrency = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    configuredConcurrency = parsed;
  }
  return configuredConcurrency;
};

module.exports = {
  enqueue,
  getJob,
  listJobs,
  setConcurrency,
};
