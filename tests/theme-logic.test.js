// Theme toggle logic extracted for testing
function applyDefaultTheme(savedTheme) {
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return "light";
}

function toggleTheme(current) {
  return current === "dark" ? "light" : "dark";
}

describe("theme logic", () => {
  it("defaults to light when no saved theme", () => {
    expect(applyDefaultTheme(null)).toBe("light");
    expect(applyDefaultTheme(undefined)).toBe("light");
  });

  it("respects saved dark theme", () => {
    expect(applyDefaultTheme("dark")).toBe("dark");
  });

  it("respects saved light theme", () => {
    expect(applyDefaultTheme("light")).toBe("light");
  });

  it("ignores invalid saved values", () => {
    expect(applyDefaultTheme("blue")).toBe("light");
    expect(applyDefaultTheme("")).toBe("light");
  });

  it("toggles from light to dark", () => {
    expect(toggleTheme("light")).toBe("dark");
  });

  it("toggles from dark to light", () => {
    expect(toggleTheme("dark")).toBe("light");
  });

  it("toggles are symmetric", () => {
    expect(toggleTheme(toggleTheme("light"))).toBe("light");
    expect(toggleTheme(toggleTheme("dark"))).toBe("dark");
  });
});
