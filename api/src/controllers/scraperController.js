const { getBrowser } = require("../services/browserService");
const cheerio = require("cheerio");
const axios = require("axios");

exports.scrapeUrl = async (req, res) => {
  const { url, type = "dynamic" } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: "URL is required" });
  }

  try {
    let data;
    if (type === "static") {
      // Use Axios + Cheerio for static sites (faster)
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });
      const $ = cheerio.load(response.data);
      data = {
        title: $("title").text(),
        metaDescription: $('meta[name="description"]').attr("content"),
        h1: $("h1").text(),
        // Example: extracting all links
        links: $("a")
          .map((i, el) => $(el).attr("href"))
          .get(),
      };
    } else {
      // Use Puppeteer for dynamic sites
      const browser = await getBrowser();
      const page = await browser.newPage();

      // Set User Agent
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      );

      await page.goto(url, { waitUntil: "networkidle2" });

      data = await page.evaluate(() => {
        return {
          title: document.title,
          metaDescription: document.querySelector('meta[name="description"]')
            ?.content,
          h1: document.querySelector("h1")?.innerText,
          // Example: extracting all links
          links: Array.from(document.querySelectorAll("a")).map((a) => a.href),
        };
      });
      await page.close();
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("Scraping error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
