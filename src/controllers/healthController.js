const { listAdapters } = require("../adapters");
const { listJobs } = require("../services/jobStore");
const projectService = require("../services/projectService");

exports.health = async (req, res) => {
  try {
    const [jobs, projects] = await Promise.all([
      listJobs(),
      projectService.listProjects({ role: "superadmin" }),
    ]);

    res.json({
      success: true,
      status: "ok",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      adapters: listAdapters().length,
      jobs: {
        total: jobs.length,
        running: jobs.filter((job) => job.status === "running").length,
        failed: jobs.filter((job) => job.status === "failed").length,
      },
      projects: projects.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "error",
      error: error.message,
    });
  }
};
