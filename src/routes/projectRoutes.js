const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");

router.get("/projects", projectController.listProjects);
router.post("/projects", projectController.createProject);
router.get("/projects/:projectId", projectController.getProject);
router.put("/projects/:projectId", projectController.updateProject);
router.delete("/projects/:projectId", projectController.deleteProject);
router.post("/projects/:projectId/targets", projectController.addTarget);
router.post("/projects/:projectId/scrape", projectController.runProjectScrape);
router.get("/projects/:projectId/export", projectController.exportProject);

module.exports = router;
