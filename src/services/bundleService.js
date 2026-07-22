const projectService = require("./projectService");
const { listJobs } = require("./jobStore");
const { buildProjectInsights } = require("./insightsService");
const { buildProjectRecommendations } = require("./recommendationService");

const buildProjectBundle = async (projectId, currentUser = {}) => {
  const project = await projectService.getProject(projectId, currentUser);
  const insights = buildProjectInsights(project);
  const recommendations = buildProjectRecommendations(insights);
  const jobs = (await listJobs()).filter((job) => job.meta?.projectId === projectId);

  return {
    generatedAt: new Date().toISOString(),
    project,
    insights,
    recommendations,
    jobs,
  };
};

module.exports = {
  buildProjectBundle,
};
