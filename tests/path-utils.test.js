const {
  normalizePath,
  getContentRelativeSegments,
  getFolderNameFromPostPath,
  getCategoryFromPath,
  getSubcategoryFromPath,
  isPostInput
} = require("../eleventy/utils/path-utils");

describe("normalizePath", () => {
  it("converts backslashes to forward slashes", () => {
    expect(normalizePath("a\\b\\c")).toBe("a/b/c");
  });

  it("leaves forward slashes unchanged", () => {
    expect(normalizePath("a/b/c")).toBe("a/b/c");
  });

  it("handles empty string", () => {
    expect(normalizePath("")).toBe("");
  });
});

describe("getContentRelativeSegments", () => {
  it("returns segments for a valid post path", () => {
    const segments = getContentRelativeSegments("D:/src/content/posts/Category/file.md");
    expect(segments).toEqual(["Category", "file.md"]);
  });

  it("returns null for non-content paths", () => {
    expect(getContentRelativeSegments("D:/src/_includes/layouts/base.njk")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(getContentRelativeSegments("")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(getContentRelativeSegments(null)).toBeNull();
  });

  it("handles nested subcategory paths", () => {
    const segments = getContentRelativeSegments("/src/content/posts/电商笔记/通用电商技巧/file.md");
    expect(segments).toEqual(["电商笔记", "通用电商技巧", "file.md"]);
  });
});

describe("getFolderNameFromPostPath", () => {
  it("returns top-level category", () => {
    expect(getFolderNameFromPostPath("/src/content/posts/电商笔记/file.md")).toBe("电商笔记");
  });

  it("returns '其他' for root-level posts", () => {
    expect(getFolderNameFromPostPath("/src/content/posts/file.md")).toBe("其他");
  });

  it("returns '其他' for non-post paths", () => {
    expect(getFolderNameFromPostPath("/src/_includes/base.njk")).toBe("其他");
  });
});

describe("getCategoryFromPath", () => {
  it("is an alias for getFolderNameFromPostPath", () => {
    const input = "/src/content/posts/福星铺货教程/file.md";
    expect(getCategoryFromPath(input)).toBe(getFolderNameFromPostPath(input));
  });
});

describe("getSubcategoryFromPath", () => {
  it("returns subcategory for nested paths", () => {
    expect(getSubcategoryFromPath("/src/content/posts/电商笔记/通用电商技巧/file.md")).toBe("通用电商技巧");
  });

  it("returns null for two-level paths", () => {
    expect(getSubcategoryFromPath("/src/content/posts/电商笔记/file.md")).toBeNull();
  });

  it("returns null for non-post paths", () => {
    expect(getSubcategoryFromPath("/src/_includes/base.njk")).toBeNull();
  });
});

describe("isPostInput", () => {
  it("returns true for valid post data", () => {
    const data = { page: { inputPath: "D:\\src\\content\\posts\\test.md" } };
    expect(isPostInput(data)).toBe(true);
  });

  it("returns false for non-md files", () => {
    const data = { page: { inputPath: "D:\\src\\content\\posts\\test.njk" } };
    expect(isPostInput(data)).toBe(false);
  });

  it("returns false for non-post paths", () => {
    const data = { page: { inputPath: "D:\\src\\_includes\\base.njk" } };
    expect(isPostInput(data)).toBe(false);
  });

  it("returns false for missing page data", () => {
    expect(isPostInput({})).toBe(false);
    expect(isPostInput(null)).toBe(false);
  });
});
