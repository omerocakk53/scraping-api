const projectService = require("../services/projectService");
const exportService = require("../services/exportService");
const {
  validateProjectRequest,
  validateProjectUpdateRequest,
  validateTargetRequest,
} = require("../utils/projectValidation");
const scrapeService = require("../services/scrapeService");
const { buildProjectInsights } = require("../services/insightsService");
const { buildProjectRecommendations } = require("../services/recommendationService");

const handleError = (res, error) => {
  if (error.code === "PROJECT_NOT_FOUND") {
    return res.status(404).json({ success: false, error: error.message });
  }

  if (error.code === "PROJECT_FORBIDDEN") {
    return res.status(403).json({ success: false, error: error.message });
  }

  return res.status(400).json({ success: false, error: error.message });
};

exports.listProjects = async (req, res) => {
  try {
    const projects = await projectService.listProjects(req.user);
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createProject = async (req, res) => {
  const { error, value } = validateProjectRequest(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: "Validasyon Hatası",
      details: error.details.map((detail) => detail.message),
    });
  }

  try {
    const project = await projectService.createProject({
      name: value.name,
      description: value.description,
      ownerId: req.user.id,
    });
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await projectService.getProject(req.params.projectId, req.user);
    res.json({ success: true, project });
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateProject = async (req, res) => {
  const { error, value } = validateProjectUpdateRequest(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: "Validasyon Hatası",
      details: error.details.map((detail) => detail.message),
    });
  }

  try {
    const project = await projectService.updateProject(
      req.params.projectId,
      value,
      req.user,
    );
    res.json({ success: true, project });
  } catch (error) {
    handleError(res, error);
  }
};

exports.deleteProject = async (req, res) => {
  try {
    await projectService.deleteProject(req.params.projectId, req.user);
    res.json({ success: true, message: "Project silindi" });
  } catch (error) {
    handleError(res, error);
  }
};

exports.addTarget = async (req, res) => {
  const { error, value } = validateTargetRequest(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: "Validasyon Hatası",
      details: error.details.map((detail) => detail.message),
    });
  }

  try {
    const target = await projectService.addTarget(
      req.params.projectId,
      value,
      req.user,
    );
    res.status(201).json({ success: true, target });
  } catch (error) {
    handleError(res, error);
  }
};

exports.runProjectScrape = async (req, res) => {
  try {
    const project = await projectService.getProject(req.params.projectId, req.user);
    const target = project.targets[0];

    if (!target) {
      return res.status(400).json({
        success: false,
        error: "Project için taranacak hedef bulunamadı",
      });
    }

    const result = await scrapeService.runScrape({
      scrapeType: target.scrapeType,
      url: target.url,
      limit: target.limit,
      projectId: project.id,
    });

    res.json({
      success: true,
      projectId: project.id,
      result,
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.exportProject = async (req, res) => {
  try {
    const format = req.query.format === "csv" ? "csv" : "json";
    const exported = await exportService.buildProjectExport(
      req.params.projectId,
      format,
      req.user,
    );

    res.setHeader("Content-Type", exported.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exported.filename}"`,
    );
    res.send(exported.body);
  } catch (error) {
    handleError(res, error);
  }
};

exports.projectInsights = async (req, res) => {
  try {
    const project = await projectService.getProject(req.params.projectId, req.user);
    const insights = buildProjectInsights(project);
    res.json({
      success: true,
      insights,
      recommendations: buildProjectRecommendations(insights),
    });
  } catch (error) {
    handleError(res, error);
  }
};
