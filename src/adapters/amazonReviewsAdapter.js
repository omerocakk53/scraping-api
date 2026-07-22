const { createReviewAdapter } = require("./baseReviewAdapter");

module.exports = createReviewAdapter({
  key: "amazon-reviews",
  label: "Amazon yorumları",
  domains: ["amazon.com", "amazon.com.tr", "amazon.de", "amazon.co.uk"],
  selectors: {
    reviewSelector: 'div[data-hook="review"]',
    authorSelector: '[data-hook="genome-widget"] span',
    titleSelector: '[data-hook="review-title"] span',
    textSelector: '[data-hook="review-body"] span',
    ratingSelector: '[data-hook="review-star-rating"] span',
    ratingAttr: "aria-label",
    dateSelector: '[data-hook="review-date"]',
    avatarSelector: "img",
    avatarAttr: "src",
    verifiedSelector: '[data-hook="avp-badge"]',
    captureRaw: true,
  },
  timeouts: {
    selectorWaitMs: 20000,
    maxIdleRounds: 5,
  },
});
