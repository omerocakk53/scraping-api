const axios = require("axios");
const cheerio = require("cheerio");
const { getBrowser } = require("./browserService");
const dataService = require("./dataService");
const {
  createFilenameFromUrl,
  extractDataWithCheerio,
  extractCustomDataWithCheerio,
  extractDataWithPuppeteer,
  extractCustomDataWithPuppeteer,
} = require("../utils/scraperUtils");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

/**
 * Performs static scraping using Axios and Cheerio.
 */
const scrapeStatic = async (url, scrapeType, selectors) => {
  console.log("[Scrape] Statik analiz yapılıyor...");
  const response = await axios.get(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  const $ = cheerio.load(response.data);

  if (scrapeType === "custom") {
    return extractCustomDataWithCheerio($, selectors);
  } else {
    return extractDataWithCheerio($);
  }
};

/**
 * Performs dynamic scraping using Puppeteer.
 */
const scrapeDynamic = async (url, scrapeType, selectors) => {
  console.log("[Scrape] Dinamik analiz yapılıyor (Browser açılıyor)...");
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(USER_AGENT);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    if (scrapeType === "custom") {
      return await extractCustomDataWithPuppeteer(page, selectors);
    } else {
      return await extractDataWithPuppeteer(page);
    }
  } catch (error) {
    throw error;
  } finally {
    await page.close();
  }
};

/**
 * Main scraping service function.
 * Orchestrates the scraping process and saves the result.
 */
exports.scrapeUrl = async ({ url, scrapeType, method, selectors }) => {
  console.log(
    `[Scrape] İşlem başlatılıyor... URL: ${url}, Tip: ${scrapeType}, Yöntem: ${method}`,
  );

  const startTime = Date.now();
  let scrapedData;

  if (method === "static") {
    scrapedData = await scrapeStatic(url, scrapeType, selectors);
  } else {
    scrapedData = await scrapeDynamic(url, scrapeType, selectors);
  }

  const duration = Date.now() - startTime;
  console.log(`[Scrape] İşlem tamamlandı. Süre: ${duration}ms`);

  // Save to file
  const filename = createFilenameFromUrl(url);
  const savedFilePath = await dataService.saveData(scrapedData, filename);

  return {
    info: {
      url,
      method,
      scrapeType,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      savedToFile: require("path").basename(savedFilePath),
    },
    data: scrapedData,
  };
};
