const scraperService = require("../services/scraperService");
const { validateScrapeRequest } = require("../utils/validation");

exports.scrapeUrl = async (req, res) => {
  // 1. ADIM: Gelen isteği doğrula (Validation)
  const { error, value } = validateScrapeRequest(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: "Validasyon Hatası",
      details: error.details.map((d) => d.message),
    });
  }

  try {
    const result = await scraperService.scrapeUrl(value);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Scraping hatası:", error.message);
    res.status(500).json({
      success: false,
      error: "Scraping işlemi başarısız oldu",
      message: error.message,
    });
  }
};
