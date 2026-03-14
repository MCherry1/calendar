// Roll20 API shim for testing TypeScript modules outside of Roll20.
// Provides mock implementations of all Roll20 globals the script depends on.

// Persistent state object (mirrors Roll20's `state` global).
(globalThis as any).state = {};

// Chat log — captures all messages sent during tests.
(globalThis as any)._chatLog = [];

(globalThis as any).sendChat = function (who: string, msg: string) {
  (globalThis as any)._chatLog.push({ who, msg });
};

// Event registry — captures on() registrations so tests can trigger them.
(globalThis as any)._eventHandlers = {} as Record<string, Array<(...args: any[]) => void>>;

(globalThis as any).on = function (event: string, handler: (...args: any[]) => void) {
  if (!(globalThis as any)._eventHandlers[event]) (globalThis as any)._eventHandlers[event] = [];
  (globalThis as any)._eventHandlers[event].push(handler);
};

// Roll20 log (just captures output).
(globalThis as any)._logMessages = [];
(globalThis as any).log = function (msg: any) {
  (globalThis as any)._logMessages.push(msg);
};

// Roll20's randomInteger(max) returns 1..max inclusive.
(globalThis as any).randomInteger = function (max: number) {
  return Math.floor(Math.random() * max) + 1;
};

// Signal to calendar.js that we're in a test environment.
(globalThis as any).__CALENDAR_TEST_MODE__ = true;

// ── Helper: reset all state between tests ──────────────────────────────────
(globalThis as any)._resetShim = function () {
  (globalThis as any).state = {};
  (globalThis as any)._chatLog = [];
  (globalThis as any)._eventHandlers = {};
  (globalThis as any)._logMessages = [];
};
