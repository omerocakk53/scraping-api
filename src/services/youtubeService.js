const { getBrowser } = require("./browserService");
const dataService = require("./dataService");
const {
  createFilenameFromUrl,
  extractYoutubeCommentsWithPuppeteer,
} = require("../utils/scraperUtils");
const path = require("path");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

exports.scrapeYoutubeComments = async (url, limit = 100) => {
  console.log(
    `[YoutubeService] YouTube yorumları kazınıyor... Hedef: ${limit === 0 ? "Bulabildiğin kadar" : limit}`,
  );
  const browser = await getBrowser();
  const page = await browser.newPage();
  const startTime = Date.now();
  try {
    await page.setUserAgent(USER_AGENT);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.evaluate(() => {
      window.scrollBy(0, 500);
    });
    console.log("[YoutubeService] Yorumların yüklenmesi bekleniyor...");
    try {
      await page.waitForSelector("ytd-comment-thread-renderer", {
        timeout: 10000,
      });
    } catch (e) {
      console.log("Yorumlar ilk bakışta bulunamadı, alta kaydırılıyor...");
      await page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
      });
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Dynamic scraping loop
    let lastCommentCount = 0;
    let noNewCommentsCount = 0;
    const maxRetries = 10; // Increased retries
    const MIN_WAIT_TIME = 2000;

    // Default limit if not provided or 0
    const targetLimit = !limit || limit <= 0 ? 100000 : limit; // Set incredibly high if 0

    console.log(
      `[YoutubeService] Yorumlar yükleniyor... Hedef: ~${targetLimit}`,
    );

    while (true) {
      // 1. Get current count
      const currentCommentsCount = await page.evaluate(() => {
        return document.querySelectorAll("ytd-comment-thread-renderer").length;
      });

      console.log(
        `[YoutubeService] Şu anki yorum sayısı: ${currentCommentsCount} / ${targetLimit}`,
      );

      // 2. Check if we reached limit
      if (currentCommentsCount >= targetLimit) {
        console.log("[YoutubeService] Hedeflenen limite ulaşıldı.");
        break;
      }

      // 3. Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
      });

      // 4. Wait for new comments or loader
      try {
        // Wait until comment count increases OR we see a spinner, but simplest is wait for count change
        // We poll every 500ms for up to 5 seconds
        await page.waitForFunction(
          (lastCount) =>
            document.querySelectorAll("ytd-comment-thread-renderer").length >
            lastCount,
          { timeout: 5000 },
          currentCommentsCount,
        );

        // If we are here, count increased
        noNewCommentsCount = 0;

        // Small delay to let render finish
        await new Promise((r) => setTimeout(r, 1000));
      } catch (e) {
        // Timeout happened, meaning count didn't increase in 5s
        console.log(
          `[YoutubeService] Yeni yorum bulunamadı/yüklenemedi... (${noNewCommentsCount + 1}/${maxRetries})`,
        );
        noNewCommentsCount++;

        // Try to find if there is a spinner
        const hasSpinner = await page.evaluate(() => {
          return !!document.querySelector("ytd-continuation-item-renderer");
        });

        if (hasSpinner) {
          console.log("[YoutubeService] Spinner var, bekleniyor...");
          // Wait a bit more if spinner exists
          await new Promise((r) => setTimeout(r, 3000));
        } else {
          // No spinner, maybe stuck? Try scrolling up and down
          await page.evaluate(() => {
            window.scrollBy(0, -1000);
            setTimeout(
              () => window.scrollTo(0, document.documentElement.scrollHeight),
              500,
            );
          });
          await new Promise((r) => setTimeout(r, 2000));
        }

        if (noNewCommentsCount >= maxRetries) {
          console.log(
            "[YoutubeService] Maksimum deneme sayısına ulaşıldı, bitiriliyor.",
          );
          break;
        }
      }
    }

    const scrapedData = await extractYoutubeCommentsWithPuppeteer(page);

    // Trim if we got more than limit (only if limit was set > 0)
    if (
      limit > 0 &&
      scrapedData.comments &&
      scrapedData.comments.length > limit
    ) {
      scrapedData.comments = scrapedData.comments.slice(0, limit);
      scrapedData.total_comments_found = limit;
    }
    const duration = Date.now() - startTime;
    console.log(`[YoutubeService] İşlem tamamlandı. Süre: ${duration}ms`);
    const filename = createFilenameFromUrl(url);
    const savedFilePath = await dataService.saveData(scrapedData, filename);
    return {
      info: {
        url,
        scrapeType: "youtube-comments",
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        savedToFile: path.basename(savedFilePath),
      },
      data: scrapedData,
    };
  } catch (error) {
    console.error("[YoutubeService] Hata:", error);
    throw error;
  } finally {
    await page.close();
  }
};
