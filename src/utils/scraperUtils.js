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
      .filter((l) => l.href),
    images: $("img")
      .map((i, el) => ({
        src: $(el).attr("src"),
        alt: $(el).attr("alt") || "",
      }))
      .get()
      .filter((img) => img.src),
  };
};

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

const extractDataWithPuppeteer = async (page) => {
  return await page.evaluate(() => {
    const getTextContent = (selector) => {
      return Array.from(document.querySelectorAll(selector))
        .map((el) => el.innerText.trim())
        .filter((text) => text.length > 0);
    };

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

const extractYoutubeCommentsWithPuppeteer = async (page) => {
  return await page.evaluate(() => {
    const comments = [];
    const commentElements = document.querySelectorAll(
      "ytd-comment-thread-renderer",
    );

    commentElements.forEach((el) => {
      const author = el.querySelector("#author-text")?.innerText?.trim();
      const text = el.querySelector("#content-text")?.innerText?.trim();
      const time = el
        .querySelector("#published-time-text a")
        ?.innerText?.trim();
      const likes =
        el.querySelector("#vote-count-middle")?.getAttribute("aria-label") ||
        el.querySelector("#vote-count-middle")?.innerText?.trim();
      const avatar = el.querySelector("#author-thumbnail img")?.src;

      if (text) {
        comments.push({
          author,
          text,
          time,
          likes,
          avatar,
        });
      }
    });

    return {
      total_comments_found: comments.length,
      comments: comments,
    };
  });
};

module.exports = {
  createFilenameFromUrl,
  extractDataWithCheerio,
  extractCustomDataWithCheerio,
  extractDataWithPuppeteer,
  extractCustomDataWithPuppeteer,
  extractYoutubeCommentsWithPuppeteer,
};
