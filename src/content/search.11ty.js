const CONTENT_PREVIEW_LENGTH = 300;

function stripHtml(value) {
  return String(value || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function getSearchText(item) {
  const fullContent = stripHtml(item?.templateContent);
  const truncated = fullContent.length > CONTENT_PREVIEW_LENGTH
    ? fullContent.slice(0, CONTENT_PREVIEW_LENGTH)
    : fullContent;

  return [item?.data?.title, item?.data?.category, item?.data?.description, truncated]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = class SearchIndex {
  data() {
    return {
      permalink: "/search.json"
    };
  }

  render(data) {
    const posts = (data.collections?.posts || []).map((item) => ({
      title: item?.data?.title || "",
      url: item?.url || "",
      category: item?.data?.category || "",
      description: item?.data?.description || "",
      date: item?.date instanceof Date ? item.date.toISOString() : "",
      content: getSearchText(item)
    }));

    return JSON.stringify(posts);
  }
};
