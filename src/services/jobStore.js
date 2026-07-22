const fs = require("fs/promises");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");

const ensureDataDir = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
};

const readJobs = async () => {
  await ensureDataDir();

  try {
    const raw = await fs.readFile(JOBS_FILE, "utf-8");
    const jobs = JSON.parse(raw);
    return Array.isArray(jobs) ? jobs : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

const saveJobs = async (jobs) => {
  await ensureDataDir();
  await fs.writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2), "utf-8");
};

const upsertJob = async (job) => {
  const jobs = await readJobs();
  const index = jobs.findIndex((item) => item.id === job.id);

  if (index === -1) {
    jobs.unshift(job);
  } else {
    jobs[index] = job;
  }

  await saveJobs(jobs);
  return job;
};

const listJobs = async () => {
  const jobs = await readJobs();
  return jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const getJob = async (jobId) => {
  const jobs = await readJobs();
  return jobs.find((job) => job.id === jobId) || null;
};

module.exports = {
  getJob,
  listJobs,
  upsertJob,
};
