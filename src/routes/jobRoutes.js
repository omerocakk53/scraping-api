const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");

router.get("/jobs", jobController.listJobs);
router.get("/jobs/:jobId", jobController.getJob);
router.get("/jobs-export", jobController.exportJobs);

module.exports = router;
