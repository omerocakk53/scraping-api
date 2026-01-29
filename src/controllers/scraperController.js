const youtubeService = require("../services/youtubeService");
const { validateScrapeRequest } = require("../utils/validation");

exports.scrapeYoutube = async (req, res) => {
  const { error, value } = validateScrapeRequest(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: "Validasyon Hatası",
      details: error.details.map((d) => d.message),
    });
  }

  try {
    const result = await youtubeService.scrapeYoutubeComments(
      value.url,
      value.limit,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Youtube Scraping hatası:", error.message);
    res.status(500).json({
      success: false,
      error: "Youtube scraping işlemi başarısız oldu",
      message: error.message,
    });
  }
};
