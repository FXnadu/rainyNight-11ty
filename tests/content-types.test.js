const { contentTypes, getContentType, resolveContentType, getAllContentTypes } = require("../eleventy/config/content-types");

describe("contentTypes", () => {
  it("has a posts entry", () => {
    expect(contentTypes.posts).toBeDefined();
    expect(contentTypes.posts.marker).toBe("/src/content/posts/");
    expect(contentTypes.posts.tag).toBe("posts");
    expect(contentTypes.posts.layout).toBe("layouts/post.njk");
  });

  it("each type has required fields", () => {
    for (const [name, config] of Object.entries(contentTypes)) {
      expect(config.marker, `${name} missing marker`).toBeDefined();
      expect(config.tag, `${name} missing tag`).toBeDefined();
      expect(config.layout, `${name} missing layout`).toBeDefined();
      expect(config.fileExtension, `${name} missing fileExtension`).toBeDefined();
      expect(config.prefix, `${name} missing prefix`).toBeDefined();
    }
  });
});

describe("getContentType", () => {
  it("returns config for known type", () => {
    const config = getContentType("posts");
    expect(config).toBeDefined();
    expect(config.marker).toBe("/src/content/posts/");
  });

  it("returns null for unknown type", () => {
    expect(getContentType("nonexistent")).toBeNull();
  });
});

describe("resolveContentType", () => {
  it("resolves posts type from path", () => {
    const result = resolveContentType("/src/content/posts/Category/file.md");
    expect(result).toBeDefined();
    expect(result.name).toBe("posts");
  });

  it("returns null for non-content paths", () => {
    expect(resolveContentType("/src/_includes/base.njk")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(resolveContentType("")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(resolveContentType(null)).toBeNull();
  });

  it("handles backslash paths", () => {
    const result = resolveContentType("D:\\src\\content\\posts\\test.md");
    expect(result).toBeDefined();
    expect(result.name).toBe("posts");
  });
});

describe("getAllContentTypes", () => {
  it("returns the contentTypes object", () => {
    expect(getAllContentTypes()).toBe(contentTypes);
  });
});
