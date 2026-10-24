const { getCategoryMeta, getSubcategoryMeta } = require("../eleventy/config/category-meta");

// Test with a mock meta object (same shape as loadCategoryMeta output)
const mockMeta = {
  categories: {
    "电商笔记": {
      description: "电商相关笔记",
      order: 1,
      subcategories: {
        "通用电商技巧": { description: "通用技巧" },
        "电商小白入门": { description: "入门指南" }
      }
    },
    "福星铺货教程": {
      description: "福星软件教程",
      order: 2
    },
    "其他other": {
      description: "暂无简介"
    }
  }
};

describe("getCategoryMeta", () => {
  it("returns meta for exact category path", () => {
    const meta = getCategoryMeta(mockMeta, "电商笔记");
    expect(meta).toBeDefined();
    expect(meta.description).toBe("电商相关笔记");
  });

  it("returns top-level meta for nested path", () => {
    const meta = getCategoryMeta(mockMeta, "电商笔记/通用电商技巧");
    expect(meta).toBeDefined();
    expect(meta.description).toBe("电商相关笔记");
  });

  it("returns null for unknown category", () => {
    expect(getCategoryMeta(mockMeta, "不存在的分类")).toBeNull();
  });

  it("handles empty string", () => {
    expect(getCategoryMeta(mockMeta, "")).toBeNull();
  });

  it("handles null input gracefully", () => {
    expect(getCategoryMeta(mockMeta, null)).toBeNull();
  });
});

describe("getSubcategoryMeta", () => {
  it("returns subcategory meta when it exists", () => {
    const meta = getSubcategoryMeta(mockMeta, "电商笔记", "通用电商技巧");
    expect(meta).toBeDefined();
    expect(meta.description).toBe("通用技巧");
  });

  it("returns null for unknown subcategory", () => {
    expect(getSubcategoryMeta(mockMeta, "电商笔记", "不存在的子分类")).toBeNull();
  });

  it("returns null for category without subcategories", () => {
    expect(getSubcategoryMeta(mockMeta, "福星铺货教程", "任意")).toBeNull();
  });

  it("returns null for unknown top-level category", () => {
    expect(getSubcategoryMeta(mockMeta, "不存在", "任意")).toBeNull();
  });
});
