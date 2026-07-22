const path = require("path");
const dataService = require("./dataService");
const projectService = require("./projectService");
const { getAdapter, isSupportedUrl, listAdapters } = require("../adapters");
const { createFilenameFromUrl } = require("../utils/scraperUtils");
const { buildResultEnvelope } = require("../utils/resultEnvelope");
const { enqueue } = require("./jobQueue");
const logger = require("../utils/logger");

const buildNotSupportedError = (scrapeType) => {
  const supported = listAdapters()
    .map((adapter) => adapter.key)
    .join(", ");
  const error = new Error(
    `Desteklenmeyen scrapeType: ${scrapeType}. Desteklenenler: ${supported}`,
  );
  error.code = "UNSUPPORTED_SCRAPE_TYPE";
  return error;
};

exports.runScrape = async ({ scrapeType, url, limit, projectId, currentUser }) => {
  const adapter = getAdapter(scrapeType);

  if (!adapter) {
    throw buildNotSupportedError(scrapeType);
  }

  if (!isSupportedUrl(adapter, url)) {
    const error = new Error(
      `${adapter.label} için geçersiz URL: ${url}`,
    );
    error.code = "UNSUPPORTED_URL";
    throw error;
  }

  if (projectId) {
    await projectService.getProject(projectId, currentUser);
  }

  const { job, result } = await enqueue({
    type: "scrape",
    meta: {
      scrapeType: adapter.key,
      url,
      limit,
      projectId: projectId || null,
    },
    task: async ({ job: currentJob, attempt }) => {
      logger.info("scrape.adapter.start", {
        jobId: currentJob.id,
        scrapeType: adapter.key,
        attempt,
      });

      const scraped = await adapter.scrape({ url, limit, jobId: currentJob.id });
      const payload = buildResultEnvelope({
        adapter,
      request: { url, limit, projectId },
        data: scraped.data,
        info: scraped.info,
        job: currentJob,
      });

      const savedFilePath = await dataService.saveData(
        payload,
        createFilenameFromUrl(url),
      );

      if (projectId) {
        try {
          await projectService.recordRun(
            projectId,
            {
              job: currentJob,
              result: {
                ...payload,
                info: {
                  ...payload.info,
                  savedToFile: path.basename(savedFilePath),
                },
              },
            },
            currentUser,
          );
        } catch (projectError) {
          logger.warn("project.record_run_failed", {
            projectId,
            jobId: currentJob.id,
            error: projectError.message,
          });
        }
      }

      return {
        ...payload,
        info: {
          ...payload.info,
          savedToFile: path.basename(savedFilePath),
        },
      };
    },
  });

  return result;
};
