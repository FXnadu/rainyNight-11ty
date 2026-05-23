const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    testTimeout: 5000,
    globals: true
  }
});
