const { getJob: getLiveJob } = require("../services/jobQueue");
const jobStore = require("../services/jobStore");
const exportService = require("../services/exportService");

exports.listJobs = async (req, res) => {
  try {
    const jobs = await jobStore.listJobs();
    res.json({
      success: true,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getJob = async (req, res) => {
  try {
    const job = (await jobStore.getJob(req.params.jobId)) || getLiveJob(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job bulunamadı",
      });
    }

    res.json({
      success: true,
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.exportJobs = async (req, res) => {
  try {
    const format = req.query.format === "csv" ? "csv" : "json";
    const exported = await exportService.buildJobsExport(format);

    res.setHeader("Content-Type", exported.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.body);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
