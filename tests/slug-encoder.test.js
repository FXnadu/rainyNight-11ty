const { encodeSlug, batchEncode, hashString, encodeBase58 } = require("../eleventy/utils/slug-encoder");

describe("hashString", () => {
  it("returns a positive integer", () => {
    const hash = hashString("test");
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(hash)).toBe(true);
  });

  it("returns consistent results for the same input", () => {
    expect(hashString("hello")).toBe(hashString("hello"));
  });

  it("returns different results for different inputs", () => {
    expect(hashString("hello")).not.toBe(hashString("world"));
  });

  it("handles empty string", () => {
    expect(hashString("")).toBeGreaterThanOrEqual(0);
  });

  it("handles Chinese characters", () => {
    const hash = hashString("测试文章");
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(hash)).toBe(true);
  });
});

describe("encodeBase58", () => {
  it("encodes 0 as first char", () => {
    expect(encodeBase58(0)).toBe("1");
  });

  it("encodes positive integers", () => {
    const result = encodeBase58(1000);
    expect(result).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
  });

  it("returns consistent results", () => {
    expect(encodeBase58(12345)).toBe(encodeBase58(12345));
  });
});

describe("encodeSlug", () => {
  it("returns a string starting with the prefix", () => {
    expect(encodeSlug("test").startsWith("p")).toBe(true);
    expect(encodeSlug("test", { prefix: "c" }).startsWith("c")).toBe(true);
  });

  it("pads to minimum length", () => {
    const result = encodeSlug("a", { minLength: 10 });
    expect(result.length).toBeGreaterThanOrEqual(11); // prefix + 10 chars
  });

  it("uses default prefix 'p'", () => {
    expect(encodeSlug("anything")[0]).toBe("p");
  });

  it("returns consistent results for same input", () => {
    expect(encodeSlug("稳定键")).toBe(encodeSlug("稳定键"));
  });

  it("only contains Base58 characters after prefix", () => {
    const result = encodeSlug("some title");
    const body = result.slice(1);
    expect(body).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
  });
});

describe("batchEncode", () => {
  it("returns a Map", () => {
    const result = batchEncode(["a", "b", "c"]);
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(3);
  });

  it("produces unique IDs even on collision", () => {
    const strings = Array.from({ length: 100 }, (_, i) => `item-${i}`);
    const result = batchEncode(strings);
    const ids = Array.from(result.values());
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("maps each input string to an ID", () => {
    const result = batchEncode(["hello", "world"]);
    expect(result.has("hello")).toBe(true);
    expect(result.has("world")).toBe(true);
    expect(result.get("hello")).toMatch(/^p/);
    expect(result.get("world")).toMatch(/^p/);
  });
});
