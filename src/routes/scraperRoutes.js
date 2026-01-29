const express = require("express");
const router = express.Router();
const scraperController = require("../controllers/scraperController");

router.post("/scrape/youtube", scraperController.scrapeYoutube);

module.exports = router;
