const { getBrowser } = require("./browserService");
const dataService = require("./dataService");
const {
  getCount,
  nudgeScroll,
  scrollToBottom,
  sleep,
  waitForCountIncrease,
} = require("./scrapeCore");
const {
  createFilenameFromUrl,
  extractYoutubeCommentsWithPuppeteer,
} = require("../utils/scraperUtils");
const path = require("path");

const YOUTUBE_COMMENT_SELECTOR = "ytd-comment-thread-renderer";
const YOUTUBE_SPINNER_SELECTOR = "ytd-continuation-item-renderer";
const YOUTUBE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
const YOUTUBE_COMMENT_WAIT_TIMEOUT_MS = 10000;
const YOUTUBE_COUNT_POLL_TIMEOUT_MS = 5000;
const YOUTUBE_FALLBACK_WAIT_MS = 3000;
const YOUTUBE_RENDER_SETTLE_MS = 1000;
const YOUTUBE_FALLBACK_SCROLL_WAIT_MS = 2000;
const YOUTUBE_MAX_IDLE_ROUNDS = 10;

const getTargetLimit = (limit) => {
  const parsedLimit = Number(limit);
  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
    return Infinity;
  }

  return parsedLimit;
};

exports.scrapeYoutubeComments = async (url, limit = 100) => {
  const targetLimit = getTargetLimit(limit);
  console.log(
    `[YoutubeService] YouTube yorumları kazınıyor... Hedef: ${targetLimit === Infinity ? "Bulabildiğin kadar" : targetLimit}`,
  );
  const browser = await getBrowser();
  const page = await browser.newPage();
  const startTime = Date.now();
  try {
    await page.setUserAgent(YOUTUBE_USER_AGENT);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.evaluate(() => window.scrollBy(0, 500));
    console.log("[YoutubeService] Yorumların yüklenmesi bekleniyor...");
    try {
      await page.waitForSelector(YOUTUBE_COMMENT_SELECTOR, {
        timeout: YOUTUBE_COMMENT_WAIT_TIMEOUT_MS,
      });
    } catch (e) {
      console.log("Yorumlar ilk bakışta bulunamadı, alta kaydırılıyor...");
      await scrollToBottom(page);
      await sleep(YOUTUBE_FALLBACK_SCROLL_WAIT_MS);
    }

    let noNewCommentsCount = 0;
    console.log(
      `[YoutubeService] Yorumlar yükleniyor... Hedef: ~${targetLimit}`,
    );

    while (noNewCommentsCount < YOUTUBE_MAX_IDLE_ROUNDS) {
      const currentCommentsCount = await getCount(page, YOUTUBE_COMMENT_SELECTOR);

      console.log(
        `[YoutubeService] Şu anki yorum sayısı: ${currentCommentsCount} / ${targetLimit}`,
      );

      if (currentCommentsCount >= targetLimit) {
        console.log("[YoutubeService] Hedeflenen limite ulaşıldı.");
        break;
      }

      await scrollToBottom(page);

      try {
        await waitForCountIncrease(
          page,
          YOUTUBE_COMMENT_SELECTOR,
          currentCommentsCount,
          YOUTUBE_COUNT_POLL_TIMEOUT_MS,
        );

        noNewCommentsCount = 0;
        await sleep(YOUTUBE_RENDER_SETTLE_MS);
      } catch (e) {
        console.log(
          `[YoutubeService] Yeni yorum bulunamadı/yüklenemedi... (${noNewCommentsCount + 1}/${YOUTUBE_MAX_IDLE_ROUNDS})`,
        );
        noNewCommentsCount++;

        const hasSpinner = await page.evaluate(
          (selector) => !!document.querySelector(selector),
          YOUTUBE_SPINNER_SELECTOR,
        );

        if (hasSpinner) {
          console.log("[YoutubeService] Spinner var, bekleniyor...");
          await sleep(YOUTUBE_FALLBACK_WAIT_MS);
        } else {
          await nudgeScroll(page);
          await sleep(YOUTUBE_FALLBACK_SCROLL_WAIT_MS);
        }
      }
    }

    const scrapedData = await extractYoutubeCommentsWithPuppeteer(page);

    if (Number.isFinite(targetLimit) && scrapedData.comments?.length > targetLimit) {
      scrapedData.comments = scrapedData.comments.slice(0, targetLimit);
      scrapedData.total_comments_found = targetLimit;
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
    await page.close().catch(() => {});
  }
};
