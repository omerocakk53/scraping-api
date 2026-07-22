const buildProjectInsights = (project) => {
  const history = Array.isArray(project.history) ? project.history : [];
  const targets = Array.isArray(project.targets) ? project.targets : [];

  const totalRuns = history.length;
  const completedRuns = history.filter((item) => item.status === "completed").length;
  const failedRuns = history.filter((item) => item.status === "failed").length;
  const totalAttempts = history.reduce((sum, item) => sum + (item.attempts || 0), 0);
  const avgAttempts = totalRuns ? Number((totalAttempts / totalRuns).toFixed(2)) : 0;

  const sourceBreakdown = history.reduce((acc, item) => {
    const key = item.scrapeType || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const latestRun = history[0] || null;
  const latestSuccess = history.find((item) => item.status === "completed") || null;
  const latestFailure = history.find((item) => item.status === "failed") || null;

  return {
    projectId: project.id,
    projectName: project.name,
    totalTargets: targets.length,
    totalRuns,
    completedRuns,
    failedRuns,
    successRate: totalRuns ? Number(((completedRuns / totalRuns) * 100).toFixed(2)) : 0,
    avgAttempts,
    sourceBreakdown,
    latestRun,
    latestSuccess,
    latestFailure,
    lastRunAt: project.lastRunAt || null,
    generatedAt: new Date().toISOString(),
  };
};

module.exports = {
  buildProjectInsights,
};
