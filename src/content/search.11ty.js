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
  const parts = [
    item?.data?.title,
    item?.data?.category,
    item?.data?.description,
    stripHtml(item?.templateContent)
  ];

  return parts
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
