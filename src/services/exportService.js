const { listJobs } = require("./jobStore");
const projectService = require("./projectService");

const csvEscape = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

const toCsv = (rows, columns) => {
  const header = columns.map(csvEscape).join(",");
  const body = rows
    .map((row) => columns.map((column) => csvEscape(row[column])).join(","))
    .join("\n");

  return [header, body].filter(Boolean).join("\n");
};

const projectHistoryToRows = (project) => {
  return (project.history || []).map((item) => ({
    projectId: project.id,
    projectName: project.name,
    jobId: item.jobId,
    scrapeType: item.scrapeType,
    url: item.url,
    limit: item.limit,
    status: item.status,
    attempts: item.attempts,
    resultCount: item.resultCount,
    savedToFile: item.savedToFile,
    createdAt: item.createdAt,
  }));
};

const jobRows = (jobs) =>
  jobs.map((job) => ({
    jobId: job.id,
    type: job.type,
    status: job.status,
    attempts: job.attempts,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    error: job.error || "",
    projectId: job.meta?.projectId || "",
    scrapeType: job.meta?.scrapeType || "",
    url: job.meta?.url || "",
    limit: job.meta?.limit ?? "",
  }));

exports.buildProjectExport = async (projectId, format, currentUser) => {
  const project = await projectService.getProject(projectId, currentUser);
  const normalizedFormat = format === "csv" ? "csv" : "json";

  if (normalizedFormat === "csv") {
    const rows = projectHistoryToRows(project);
    return {
      filename: `${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-history.csv`,
      contentType: "text/csv; charset=utf-8",
      body: toCsv(rows, [
        "projectId",
        "projectName",
        "jobId",
        "scrapeType",
        "url",
        "limit",
        "status",
        "attempts",
        "resultCount",
        "savedToFile",
        "createdAt",
      ]),
    };
  }

  return {
    filename: `${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-export.json`,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(
      {
        success: true,
        exportGeneratedAt: new Date().toISOString(),
        project,
      },
      null,
      2,
    ),
  };
};

exports.buildJobsExport = async (format) => {
  const jobs = await listJobs();
  const normalizedFormat = format === "csv" ? "csv" : "json";

  if (normalizedFormat === "csv") {
    const rows = jobRows(jobs);
    return {
      filename: `jobs-export.csv`,
      contentType: "text/csv; charset=utf-8",
      body: toCsv(rows, [
        "jobId",
        "type",
        "status",
        "attempts",
        "createdAt",
        "startedAt",
        "finishedAt",
        "error",
        "projectId",
        "scrapeType",
        "url",
        "limit",
      ]),
    };
  }

  return {
    filename: "jobs-export.json",
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(
      {
        success: true,
        exportGeneratedAt: new Date().toISOString(),
        jobs,
      },
      null,
      2,
    ),
  };
};
