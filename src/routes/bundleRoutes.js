const express = require("express");
const router = express.Router();
const bundleController = require("../controllers/bundleController");

router.get("/projects/:projectId/bundle", bundleController.getProjectBundle);

module.exports = router;
