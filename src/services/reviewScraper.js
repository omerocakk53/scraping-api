const { getBrowser } = require("./browserService");
const {
  getCount,
  nudgeScroll,
  scrollToBottom,
  sleep,
  waitForCountIncrease,
} = require("./scrapeCore");
const logger = require("../utils/logger");

const DEFAULT_TIMEOUTS = {
  initialLoadMs: 90000,
  selectorWaitMs: 15000,
  countPollTimeoutMs: 6000,
  renderSettleMs: 1200,
  fallbackScrollWaitMs: 2000,
  spinnerWaitMs: 2500,
  maxIdleRounds: 8,
};

const getTargetLimit = (limit) => {
  const parsedLimit = Number(limit);
  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
    return Infinity;
  }

  return parsedLimit;
};

const normalizeReviewText = (text) => {
  if (!text) {
    return "";
  }

  return text.replace(/\s+/g, " ").trim();
};

const scrapeReviewItemsFromPage = async (page, config) => {
  return page.evaluate((pageConfig) => {
    const pickText = (root, selector) => {
      if (!selector) {
        return "";
      }

      const element = root.querySelector(selector);
      return element ? element.innerText.trim() : "";
    };

    const pickAttr = (root, selector, attr) => {
      if (!selector) {
        return "";
      }

      const element = root.querySelector(selector);
      return element ? element.getAttribute(attr) || "" : "";
    };

    const items = Array.from(document.querySelectorAll(pageConfig.reviewSelector));

    return items
      .map((item) => {
        const review = {
          author: pickText(item, pageConfig.authorSelector),
          title: pickText(item, pageConfig.titleSelector),
          text: pickText(item, pageConfig.textSelector),
          rating: pickAttr(item, pageConfig.ratingSelector, pageConfig.ratingAttr || "aria-label") || pickText(item, pageConfig.ratingSelector),
          date: pickText(item, pageConfig.dateSelector),
          avatar: pickAttr(item, pageConfig.avatarSelector, pageConfig.avatarAttr || "src"),
          verified: pageConfig.verifiedSelector ? Boolean(item.querySelector(pageConfig.verifiedSelector)) : null,
          sourceUrl: window.location.href,
        };

        if (pageConfig.extraFields) {
          pageConfig.extraFields.forEach((field) => {
            if (!field.name || !field.selector) {
              return;
            }

            if (field.attr) {
              review[field.name] = pickAttr(item, field.selector, field.attr);
            } else {
              review[field.name] = pickText(item, field.selector);
            }
          });
        }

        if (pageConfig.captureRaw) {
          review.raw = item.innerText.trim();
        }

        return review;
      })
      .filter((review) => review.text || review.title || review.author);
  }, config);
};

const scrapeReviewPage = async ({
  url,
  limit,
  source,
  selectors,
  userAgent,
  scrollSelector,
  timeouts = {},
}) => {
  const targetLimit = getTargetLimit(limit);
  const settings = {
    ...DEFAULT_TIMEOUTS,
    ...timeouts,
  };

  logger.info("scrape.review.start", {
    source: source.key,
    url,
    targetLimit,
  });

  const browser = await getBrowser();
  const page = await browser.newPage();
  const startedAt = Date.now();

  try {
    if (userAgent) {
      await page.setUserAgent(userAgent);
    }

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: settings.initialLoadMs,
    });

    if (scrollSelector) {
      await page.evaluate((selector) => {
        const node = document.querySelector(selector);
        if (node) {
          node.scrollIntoView({ behavior: "instant", block: "start" });
        } else {
          window.scrollBy(0, 700);
        }
      }, scrollSelector);
    } else {
      await page.evaluate(() => window.scrollBy(0, 700));
    }

    if (selectors.reviewSelector) {
      try {
        await page.waitForSelector(selectors.reviewSelector, {
          timeout: settings.selectorWaitMs,
        });
      } catch (error) {
        logger.warn("scrape.review.selector_missing", {
          source: source.key,
          selector: selectors.reviewSelector,
        });
      }
    }

    let noNewReviewsCount = 0;
    while (noNewReviewsCount < settings.maxIdleRounds) {
      const currentReviewsCount = selectors.reviewSelector
        ? await getCount(page, selectors.reviewSelector)
        : 0;

      if (Number.isFinite(targetLimit) && currentReviewsCount >= targetLimit) {
        break;
      }

      if (selectors.reviewSelector) {
        await scrollToBottom(page);
      }

      try {
        if (selectors.reviewSelector) {
          await waitForCountIncrease(
            page,
            selectors.reviewSelector,
            currentReviewsCount,
            settings.countPollTimeoutMs,
          );
        }

        noNewReviewsCount = 0;
        await sleep(settings.renderSettleMs);
      } catch (error) {
        noNewReviewsCount += 1;

        const isSpinnerVisible = selectors.spinnerSelector
          ? await page.evaluate(
              (spinnerSelector) => Boolean(document.querySelector(spinnerSelector)),
              selectors.spinnerSelector,
            )
          : false;

        if (isSpinnerVisible) {
          await sleep(settings.spinnerWaitMs);
        } else {
          await nudgeScroll(page);
          await sleep(settings.fallbackScrollWaitMs);
        }
      }
    }

    const reviews = await scrapeReviewItemsFromPage(page, selectors);
    const trimmedReviews = Number.isFinite(targetLimit)
      ? reviews.slice(0, targetLimit)
      : reviews;

    const duration = Date.now() - startedAt;

    return {
      info: {
        url,
        sourceKey: source.key,
        sourceLabel: source.label,
        scrapeType: source.key,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
      data: {
        total_reviews_found: trimmedReviews.length,
        reviews: trimmedReviews.map((review) => ({
          ...review,
          text: normalizeReviewText(review.text),
          title: normalizeReviewText(review.title),
          author: normalizeReviewText(review.author),
          date: normalizeReviewText(review.date),
        })),
      },
    };
  } finally {
    await page.close().catch(() => {});
  }
};

module.exports = {
  scrapeReviewPage,
};
