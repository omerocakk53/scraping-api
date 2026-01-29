const express = require("express");
const router = express.Router();
const scraperController = require("../controllers/scraperController");

// Kullanım
// {
//   "url": "https://ornek-site.com",
//   "type": "dynamic" // veya statik siteler için "static"
// }

router.post("/scrape", scraperController.scrapeUrl);

module.exports = router;
