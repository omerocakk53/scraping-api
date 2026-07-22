const youtubeService = require("../services/youtubeService");

const adapter = {
  key: "youtube-comments",
  label: "YouTube yorumları",
  domains: ["youtube.com", "m.youtube.com", "youtu.be"],
  kind: "video-comments",
  canHandleUrl(url) {
    try {
      const hostname = new URL(url).hostname;
      return this.domains.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
      );
    } catch (error) {
      return false;
    }
  },
  async scrape({ url, limit }) {
    return youtubeService.scrapeYoutubeComments(url, limit);
  },
};

module.exports = adapter;
