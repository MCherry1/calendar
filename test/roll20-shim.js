// Roll20 API shim for testing calendar.js outside of Roll20.
// Provides mock implementations of all Roll20 globals the script depends on.
//
// Compatible with both Deno and Node.js test runners.

// Persistent state object (mirrors Roll20's `state` global).
globalThis.state = {};

// Chat log — captures all messages sent during tests.
globalThis._chatLog = [];

globalThis.sendChat = function (who, msg) {
  globalThis._chatLog.push({ who: who, msg: msg });
};

// Event registry — captures on() registrations so tests can trigger them.
globalThis._eventHandlers = {};

globalThis.on = function (event, handler) {
  if (!globalThis._eventHandlers[event]) globalThis._eventHandlers[event] = [];
  globalThis._eventHandlers[event].push(handler);
};

// Roll20 log (just captures output).
globalThis._logMessages = [];
globalThis.log = function (msg) {
  globalThis._logMessages.push(msg);
};

// Roll20's randomInteger(max) returns 1..max inclusive.
globalThis.randomInteger = function (max) {
  return Math.floor(Math.random() * max) + 1;
};

// Signal to calendar.js that we're in a test environment.
globalThis.__CALENDAR_TEST_MODE__ = true;

// ── Helper: reset all state between tests ──────────────────────────────────
globalThis._resetShim = function () {
  globalThis.state = {};
  globalThis._chatLog = [];
  globalThis._eventHandlers = {};
  globalThis._logMessages = [];
};
