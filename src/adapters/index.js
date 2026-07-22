const youtubeCommentsAdapter = require("./youtubeCommentsAdapter");
const amazonReviewsAdapter = require("./amazonReviewsAdapter");
const playStoreReviewsAdapter = require("./playStoreReviewsAdapter");

const adapters = new Map([
  [youtubeCommentsAdapter.key, youtubeCommentsAdapter],
  [amazonReviewsAdapter.key, amazonReviewsAdapter],
  [playStoreReviewsAdapter.key, playStoreReviewsAdapter],
]);

const getAdapter = (scrapeType) => adapters.get(scrapeType);

const getDefaultAdapterKey = () => {
  const firstAdapter = adapters.values().next().value;
  return firstAdapter ? firstAdapter.key : "youtube-comments";
};

const listAdapters = () => Array.from(adapters.values()).map((adapter) => ({
  key: adapter.key,
  label: adapter.label,
  domains: adapter.domains || [],
  kind: adapter.kind || "unknown",
}));

const isSupportedUrl = (adapter, url) => {
  if (!adapter?.canHandleUrl) {
    return true;
  }

  return adapter.canHandleUrl(url);
};

module.exports = {
  getAdapter,
  getDefaultAdapterKey,
  listAdapters,
  isSupportedUrl,
};
