const assert = require('assert');

// Mock Browser Environment
global.window = {
    matchMedia: (query) => ({
        matches: query.includes('dark'), // Simulate system dark mode preference
        addListener: () => {},
        removeListener: () => {}
    })
};

global.localStorage = {
    store: {},
    getItem: function(key) { return this.store[key] || null; },
    setItem: function(key, value) { this.store[key] = value.toString(); },
    clear: function() { this.store = {}; }
};

global.document = {
    documentElement: {
        attributes: {},
        getAttribute: function(key) { return this.attributes[key]; },
        setAttribute: function(key, value) { this.attributes[key] = value; }
    },
    querySelector: () => ({ addEventListener: () => {} }) // Mock toggle button
};

// Test 1: Default Logic (Simulating Inline Script)
console.log('Test 1: Default Theme Logic (Inline Script Simulation)');
global.localStorage.clear();
// Reset DOM
global.document.documentElement.attributes = {};

// Simulate Inline Script - 默认 light 模式
(function() {
    const savedTheme = global.localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
        global.document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        global.document.documentElement.setAttribute('data-theme', 'light');
    }
})();

// Assertions
assert.strictEqual(global.document.documentElement.getAttribute('data-theme'), 'light', 'Default should be light');
console.log('PASS: Default is light');


// Test 2: Persistence Logic (Simulate Saved Dark Theme)
console.log('\nTest 2: Persistence Logic (Saved Dark Theme)');
global.localStorage.setItem('theme', 'dark');
global.document.documentElement.attributes = {};

(function() {
    const savedTheme = global.localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
        global.document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        global.document.documentElement.setAttribute('data-theme', 'light');
    }
})();

assert.strictEqual(global.document.documentElement.getAttribute('data-theme'), 'dark', 'Should respect saved dark theme');
console.log('PASS: Respects saved dark theme');


// Test 3: Persistence Logic (Simulate Saved Light Theme)
console.log('\nTest 3: Persistence Logic (Saved Light Theme)');
global.localStorage.setItem('theme', 'light');
global.document.documentElement.attributes = {};

(function() {
    const savedTheme = global.localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
        global.document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        global.document.documentElement.setAttribute('data-theme', 'light');
    }
})();

assert.strictEqual(global.document.documentElement.getAttribute('data-theme'), 'light', 'Should respect saved light theme');
console.log('PASS: Respects saved light theme');


// Test 4: Toggle Logic
console.log('\nTest 4: Toggle Logic');
// Reset to Light
global.document.documentElement.setAttribute('data-theme', 'light');
global.localStorage.setItem('theme', 'light');

// Extract Toggle Logic from main.js idea
function onToggle() {
    let theme = global.document.documentElement.getAttribute("data-theme");
    if (theme === "dark") {
        theme = "light";
    } else {
        theme = "dark";
    }
    global.document.documentElement.setAttribute("data-theme", theme);
    global.localStorage.setItem("theme", theme);
}

// Action: Click Toggle
onToggle();
assert.strictEqual(global.document.documentElement.getAttribute('data-theme'), 'dark', 'Should switch to dark');
assert.strictEqual(global.localStorage.getItem('theme'), 'dark', 'Should save dark preference');
console.log('PASS: Toggles to Dark');

// Action: Click Toggle Again
onToggle();
assert.strictEqual(global.document.documentElement.getAttribute('data-theme'), 'light', 'Should switch back to light');
assert.strictEqual(global.localStorage.getItem('theme'), 'light', 'Should save light preference');
console.log('PASS: Toggles back to Light');

console.log('\nAll tests passed successfully.');
