const { createReviewAdapter } = require("./baseReviewAdapter");

module.exports = createReviewAdapter({
  key: "play-store-reviews",
  label: "Play Store yorumları",
  domains: ["play.google.com"],
  selectors: {
    reviewSelector: 'div[data-review-id], div[jscontroller][jsaction]',
    authorSelector: ".X5PpBb, .s29v5c, .fw8m8",
    titleSelector: ".h3YV2d, .RHo1pe",
    textSelector: ".h3YV2d, .MyEned, .UD7Dzf",
    ratingSelector: '[role="img"]',
    ratingAttr: "aria-label",
    dateSelector: ".bp9Aid, .p2TkOb",
    avatarSelector: "img",
    avatarAttr: "src",
    captureRaw: true,
  },
  timeouts: {
    selectorWaitMs: 20000,
    maxIdleRounds: 5,
  },
});
