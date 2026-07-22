const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "../../data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const MAX_HISTORY_ITEMS = 20;

const ensureDataDir = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
};

const readProjects = async () => {
  await ensureDataDir();

  try {
    const raw = await fs.readFile(PROJECTS_FILE, "utf-8");
    const projects = JSON.parse(raw);
    return Array.isArray(projects) ? projects : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

const saveProjects = async (projects) => {
  await ensureDataDir();
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
};

const createId = () => crypto.randomUUID();

const normalizeProject = (project) => ({
  id: project.id,
  name: project.name,
  description: project.description || "",
  ownerId: project.ownerId,
  targets: Array.isArray(project.targets) ? project.targets : [],
  history: Array.isArray(project.history) ? project.history : [],
  lastRunAt: project.lastRunAt || null,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
});

const findProjectIndex = (projects, projectId) =>
  projects.findIndex((project) => project.id === projectId);

const assertProjectAccess = (project, currentUser) => {
  if (!project) {
    const error = new Error("Project bulunamadı");
    error.code = "PROJECT_NOT_FOUND";
    throw error;
  }

  if (currentUser?.role === "superadmin") {
    return;
  }

  if (project.ownerId !== currentUser?.id) {
    const error = new Error("Project erişimi reddedildi");
    error.code = "PROJECT_FORBIDDEN";
    throw error;
  }
};

exports.listProjects = async (currentUser = {}) => {
  const projects = await readProjects();
  const normalized = projects.map(normalizeProject);

  if (currentUser.role === "superadmin") {
    return normalized;
  }

  return normalized.filter((project) => project.ownerId === currentUser.id);
};

exports.createProject = async ({ name, description = "", ownerId }) => {
  const projects = await readProjects();
  const now = new Date().toISOString();
  const project = normalizeProject({
    id: createId(),
    name,
    description,
    ownerId,
    targets: [],
    history: [],
    lastRunAt: null,
    createdAt: now,
    updatedAt: now,
  });

  projects.unshift(project);
  await saveProjects(projects);
  return project;
};

exports.getProject = async (projectId, currentUser = {}) => {
  const projects = await readProjects();
  const foundProject = projects.find((item) => item.id === projectId);
  const project = foundProject ? normalizeProject(foundProject) : null;
  assertProjectAccess(project, currentUser);
  return project;
};

exports.updateProject = async (projectId, patch, currentUser = {}) => {
  const projects = await readProjects();
  const index = findProjectIndex(projects, projectId);

  if (index === -1) {
    const error = new Error("Project bulunamadı");
    error.code = "PROJECT_NOT_FOUND";
    throw error;
  }

  const project = normalizeProject(projects[index]);
  assertProjectAccess(project, currentUser);

  const updatedProject = normalizeProject({
    ...project,
    name: patch.name ?? project.name,
    description: patch.description ?? project.description,
    updatedAt: new Date().toISOString(),
  });

  projects[index] = updatedProject;
  await saveProjects(projects);
  return updatedProject;
};

exports.deleteProject = async (projectId, currentUser = {}) => {
  const projects = await readProjects();
  const index = findProjectIndex(projects, projectId);

  if (index === -1) {
    const error = new Error("Project bulunamadı");
    error.code = "PROJECT_NOT_FOUND";
    throw error;
  }

  assertProjectAccess(normalizeProject(projects[index]), currentUser);

  const [removed] = projects.splice(index, 1);
  await saveProjects(projects);
  return normalizeProject(removed);
};

exports.addTarget = async (projectId, target, currentUser = {}) => {
  const projects = await readProjects();
  const index = findProjectIndex(projects, projectId);

  if (index === -1) {
    const error = new Error("Project bulunamadı");
    error.code = "PROJECT_NOT_FOUND";
    throw error;
  }

  const project = normalizeProject(projects[index]);
  assertProjectAccess(project, currentUser);

  const now = new Date().toISOString();
  const normalizedTarget = {
    id: createId(),
    scrapeType: target.scrapeType,
    url: target.url,
    limit: target.limit ?? null,
    label: target.label || "",
    createdAt: now,
  };

  const updatedProject = normalizeProject({
    ...project,
    targets: [normalizedTarget, ...project.targets],
    updatedAt: now,
  });

  projects[index] = updatedProject;
  await saveProjects(projects);
  return normalizedTarget;
};

exports.recordRun = async (projectId, run, currentUser = {}) => {
  const projects = await readProjects();
  const index = findProjectIndex(projects, projectId);

  if (index === -1) {
    const error = new Error("Project bulunamadı");
    error.code = "PROJECT_NOT_FOUND";
    throw error;
  }

  const project = normalizeProject(projects[index]);
  assertProjectAccess(project, currentUser);

  const now = new Date().toISOString();
  const historyItem = {
    id: run.job?.id || createId(),
    jobId: run.job?.id || null,
    scrapeType: run.result?.source?.scrapeType || run.scrapeType || null,
    url: run.result?.request?.url || run.url || null,
    limit: run.result?.request?.limit ?? run.limit ?? null,
    savedToFile: run.result?.info?.savedToFile || null,
    resultCount: run.result?.info?.resultCount ?? null,
    status: run.job?.status || "completed",
    attempts: run.job?.attempts || run.result?.info?.attempts || 1,
    createdAt: now,
  };

  const history = [historyItem, ...project.history].slice(0, MAX_HISTORY_ITEMS);
  const updatedProject = normalizeProject({
    ...project,
    history,
    lastRunAt: now,
    updatedAt: now,
  });

  projects[index] = updatedProject;
  await saveProjects(projects);
  return historyItem;
};
