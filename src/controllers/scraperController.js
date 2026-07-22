const scrapeService = require("../services/scrapeService");
const { validateScrapeRequest } = require("../utils/validation");

const handleScrapeRequest = async (req, res) => {
  const { error, value } = validateScrapeRequest(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: "Validasyon Hatası",
      details: error.details.map((d) => d.message),
    });
  }

  try {
    const result = await scrapeService.runScrape({
      scrapeType: value.scrapeType,
      url: value.url,
      limit: value.limit,
      projectId: value.projectId,
      currentUser: req.user,
    });

    res.json({
      ...result,
    });
  } catch (error) {
    console.error("Scrape hatası:", error.message);
    if (
      error.code === "UNSUPPORTED_SCRAPE_TYPE" ||
      error.code === "UNSUPPORTED_URL"
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    if (error.code === "PROJECT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    if (error.code === "PROJECT_FORBIDDEN") {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      error: "Scraping işlemi başarısız oldu",
      message: error.message,
    });
  }
};

exports.scrape = handleScrapeRequest;
exports.scrapeYoutube = handleScrapeRequest;
