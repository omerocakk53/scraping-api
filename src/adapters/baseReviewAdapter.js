const { scrapeReviewPage } = require("../services/reviewScraper");

const hostMatches = (hostname, domains = []) => {
  if (!hostname) {
    return false;
  }

  return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
};

const createReviewAdapter = ({
  key,
  label,
  domains = [],
  selectors,
  userAgent,
  scrollSelector,
  timeouts,
}) => {
  return {
    key,
    label,
    domains,
    kind: "review",
    canHandleUrl(url) {
      try {
        return hostMatches(new URL(url).hostname, domains);
      } catch (error) {
        return false;
      }
    },
    async scrape({ url, limit }) {
      return scrapeReviewPage({
        url,
        limit,
        source: { key, label },
        selectors,
        userAgent,
        scrollSelector,
        timeouts,
      });
    },
  };
};

module.exports = {
  createReviewAdapter,
};
