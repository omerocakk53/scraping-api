const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getCount = async (page, selector) => {
  return page.evaluate((sel) => document.querySelectorAll(sel).length, selector);
};

const scrollToBottom = async (page) => {
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
};

const nudgeScroll = async (page, offset = -1000) => {
  await page.evaluate((scrollOffset) => {
    window.scrollBy(0, scrollOffset);
    setTimeout(
      () => window.scrollTo(0, document.documentElement.scrollHeight),
      500,
    );
  }, offset);
};

const waitForCountIncrease = async (page, selector, lastCount, timeoutMs) => {
  await page.waitForFunction(
    ({ sel, prevCount }) =>
      document.querySelectorAll(sel).length > prevCount,
    { timeout: timeoutMs },
    { sel: selector, prevCount: lastCount },
  );
};

module.exports = {
  getCount,
  nudgeScroll,
  scrollToBottom,
  sleep,
  waitForCountIncrease,
};
