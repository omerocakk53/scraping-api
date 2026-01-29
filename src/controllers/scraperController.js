const { getBrowser } = require("../services/browserService");
const cheerio = require("cheerio");
const axios = require("axios");
const { validateScrapeRequest } = require("../utils/validation");
const fs = require("fs");
const path = require("path");

// ==========================================
// YARDIMCI METOTLAR (Helper Methods)
// ==========================================

/**
 * URL'den geçerli bir dosya ismi oluşturur
 */
const createFilenameFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/[^a-z0-9]/gi, "-");
    const pathname = urlObj.pathname.replace(/[^a-z0-9]/gi, "-");
    const date = new Date().toISOString().replace(/[:.]/g, "-");
    return `${hostname}${pathname}-${date}.json`;
  } catch (error) {
    return `unknown-${Date.now()}.json`;
  }
};

/**
 * JSON verisini dosyaya kaydeder
 */
const saveToDataFolder = async (data, filename) => {
  const dataDir = path.join(__dirname, "../../data");
  const filePath = path.join(dataDir, filename);

  try {
    // Klasör yoksa oluştur
    if (!fs.existsSync(dataDir)) {
      await fs.promises.mkdir(dataDir, { recursive: true });
    }

    await fs.promises.writeFile(
      filePath,
      JSON.stringify(data, null, 2),
      "utf-8",
    );
    console.log(`[File] Veri kaydedildi: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`[File] Dosya kaydetme hatası: ${error.message}`);
    return null;
  }
};

/**
 * Cheerio kullanarak HTML içeriğinden veri ayıklar
 * @param {Object} $ - Cheerio instance
 */
const extractDataWithCheerio = ($) => {
  return {
    metadata: {
      title: $("title").text().trim(),
      description: $('meta[name="description"]').attr("content") || "",
      keywords: $('meta[name="keywords"]').attr("content") || "",
      author: $('meta[name="author"]').attr("content") || "",
      viewport: $('meta[name="viewport"]').attr("content") || "",
    },
    headings: {
      h1: $("h1")
        .map((i, el) => $(el).text().trim())
        .get(),
      h2: $("h2")
        .map((i, el) => $(el).text().trim())
        .get(),
      h3: $("h3")
        .map((i, el) => $(el).text().trim())
        .get(),
    },
    links: $("a")
      .map((i, el) => ({
        text: $(el).text().trim(),
        href: $(el).attr("href"),
        title: $(el).attr("title") || "",
      }))
      .get()
      .filter((l) => l.href), // Boş linkleri filtrele
    images: $("img")
      .map((i, el) => ({
        src: $(el).attr("src"),
        alt: $(el).attr("alt") || "",
      }))
      .get()
      .filter((img) => img.src),
  };
};

/**
 * Puppeteer kullanarak sayfa içeriğinden veri ayıklar
 * @param {Object} page - Puppeteer page instance
 */
const extractDataWithPuppeteer = async (page) => {
  return await page.evaluate(() => {
    // Yardımcı fonksiyon: Element listesinden metin dizisi oluşturur
    const getTextContent = (selector) => {
      return Array.from(document.querySelectorAll(selector))
        .map((el) => el.innerText.trim())
        .filter((text) => text.length > 0);
    };

    // Yardımcı fonksiyon: Meta tag içeriğini alır
    const getMetaContent = (name) => {
      const element = document.querySelector(`meta[name="${name}"]`);
      return element ? element.content : "";
    };

    return {
      metadata: {
        title: document.title,
        description: getMetaContent("description"),
        keywords: getMetaContent("keywords"),
        author: getMetaContent("author"),
        viewport: getMetaContent("viewport"),
      },
      headings: {
        h1: getTextContent("h1"),
        h2: getTextContent("h2"),
        h3: getTextContent("h3"),
      },
      links: Array.from(document.querySelectorAll("a"))
        .map((a) => ({
          text: a.innerText.trim(),
          href: a.href,
          title: a.title || "",
        }))
        .filter((l) => l.href),
      images: Array.from(document.querySelectorAll("img"))
        .map((img) => ({
          src: img.src,
          alt: img.alt || "",
        }))
        .filter((img) => img.src),
    };
  });
};

// ==========================================
// ANA KONTROLCÜ (Main Controller)
// ==========================================

const extractCustomDataWithCheerio = ($, selectors) => {
  const result = {};
  selectors.forEach(({ name, selector, attr }) => {
    if (attr) {
      result[name] = $(selector)
        .map((i, el) => $(el).attr(attr))
        .get();
    } else {
      result[name] = $(selector)
        .map((i, el) => $(el).text().trim())
        .get();
    }
  });
  return result;
};

const extractCustomDataWithPuppeteer = async (page, selectors) => {
  return await page.evaluate((selectors) => {
    const result = {};
    selectors.forEach(({ name, selector, attr }) => {
      const elements = Array.from(document.querySelectorAll(selector));
      if (attr) {
        result[name] = elements
          .map((el) => el.getAttribute(attr))
          .filter((v) => v !== null);
      } else {
        result[name] = elements.map((el) => el.innerText.trim());
      }
    });
    return result;
  }, selectors);
};

// ==========================================
// ANA KONTROLCÜ (Main Controller)
// ==========================================

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

  const { url, scrapeType, method, selectors } = value;
  console.log(
    `[Scrape] İşlem başlatılıyor... URL: ${url}, Tip: ${scrapeType}, Yöntem: ${method}`,
  );

  try {
    let scrapedData;
    const startTime = Date.now();

    if (method === "static") {
      // --- STATİK SCRAPING (Axios + Cheerio) ---
      console.log("[Scrape] Statik analiz yapılıyor...");

      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const $ = cheerio.load(response.data);

      if (scrapeType === "custom") {
        scrapedData = extractCustomDataWithCheerio($, selectors);
      } else {
        scrapedData = extractDataWithCheerio($);
      }
    } else {
      // --- DİNAMİK SCRAPING (Puppeteer) ---
      console.log("[Scrape] Dinamik analiz yapılıyor (Browser açılıyor)...");

      const browser = await getBrowser();
      const page = await browser.newPage();

      try {
        // Tarayıcı ayarları
        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        );

        // Sayfaya git ve ağ trafiği durana kadar bekle
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

        // Veriyi çek
        if (scrapeType === "custom") {
          scrapedData = await extractCustomDataWithPuppeteer(page, selectors);
        } else {
          scrapedData = await extractDataWithPuppeteer(page);
        }
      } catch (pageError) {
        throw pageError;
      } finally {
        await page.close(); // İş bittiğinde sekmeyi kapat
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Scrape] İşlem tamamlandı. Süre: ${duration}ms`);

    // 3. ADIM: Veriyi Dosyaya Kaydet
    const filename = createFilenameFromUrl(url);
    const savedFilePath = await saveToDataFolder(scrapedData, filename);

    // 4. ADIM: Başarılı yanıtı döndür
    res.json({
      success: true,
      info: {
        url: url,
        method: method,
        scrapeType: scrapeType,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        savedToFile: savedFilePath
          ? path.basename(savedFilePath)
          : "Failing to save",
      },
      data: scrapedData, // Bölümlendirilmiş veri
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
