// Roll20 API shim for testing TypeScript modules outside of Roll20.
// Provides mock implementations of all Roll20 globals the script depends on.

// Persistent state object (mirrors Roll20's `state` global).
(globalThis as any).state = {};

// Roll20 object storage for tests.
(globalThis as any)._roll20Objects = {};
(globalThis as any)._roll20IdCounter = 1;
(globalThis as any)._campaignState = {
  playerpageid: "",
  playerspecificpages: {}
};

// Chat log — captures all messages sent during tests.
(globalThis as any)._chatLog = [];

(globalThis as any)._gmIds = new Set<string>(["GM"]);

(globalThis as any).sendChat = function (who: string, msg: string, _cb?: any, opts?: any) {
  (globalThis as any)._chatLog.push({ who, msg, opts: opts || null });
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

(globalThis as any).playerIsGM = function (playerid: string) {
  return (globalThis as any)._gmIds.has(String(playerid || ""));
};

function _newRoll20Id() {
  const next = (globalThis as any)._roll20IdCounter++;
  return `-MOCK${String(next).padStart(6, "0")}`;
}

function _normalizeAttrBag(type: string, attrs: Record<string, any>) {
  const out: Record<string, any> = { ...(attrs || {}) };
  out._type = type;
  if (!out._id) out._id = _newRoll20Id();
  if (!out.id) out.id = out._id;
  if (out.pageid != null && out._pageid == null) out._pageid = out.pageid;
  if (out._pageid != null && out.pageid == null) out.pageid = out._pageid;
  if (out.characterid != null && out._characterid == null) out._characterid = out.characterid;
  if (out._characterid != null && out.characterid == null) out.characterid = out._characterid;
  return out;
}

function _makeObj(type: string, attrs: Record<string, any>) {
  const bag = _normalizeAttrBag(type, attrs);
  const obj: any = {
    id: bag._id,
    get(prop: string, cb?: any) {
      const key = String(prop || "");
      const value = key === "id" ? bag._id : bag[key];
      if (typeof cb === "function") cb(value);
      return value;
    },
    set(prop: any, value?: any) {
      if (prop && typeof prop === "object") {
        Object.keys(prop).forEach((key) => {
          bag[key] = prop[key];
        });
      } else {
        bag[String(prop)] = value;
      }
      if (bag.pageid != null && bag._pageid == null) bag._pageid = bag.pageid;
      if (bag._pageid != null && bag.pageid == null) bag.pageid = bag._pageid;
      if (bag.characterid != null && bag._characterid == null) bag._characterid = bag.characterid;
      if (bag._characterid != null && bag.characterid == null) bag.characterid = bag._characterid;
      return obj;
    },
    remove() {
      delete (globalThis as any)._roll20Objects[bag._id];
    }
  };
  (globalThis as any)._roll20Objects[bag._id] = { type, bag, obj };
  return obj;
}

(globalThis as any).createObj = function (type: string, attributes: Record<string, any>) {
  return _makeObj(String(type || ""), attributes || {});
};

(globalThis as any).getObj = function (type: string, id: string) {
  const found = (globalThis as any)._roll20Objects[String(id || "")];
  if (!found) return null;
  if (String(found.type) !== String(type || "")) return null;
  return found.obj;
};

(globalThis as any).findObjs = function (attrs: Record<string, any>, options?: Record<string, any>) {
  const want = attrs || {};
  const caseInsensitive = !!(options && options.caseInsensitive);
  return Object.values((globalThis as any)._roll20Objects)
    .filter((entry: any) => {
      const bag = entry.bag || {};
      return Object.keys(want).every((key) => {
        const actual = bag[key];
        const expected = want[key];
        if (typeof actual === "string" && typeof expected === "string" && caseInsensitive) {
          return actual.toLowerCase() === expected.toLowerCase();
        }
        return actual === expected;
      });
    })
    .map((entry: any) => entry.obj);
};

(globalThis as any).Campaign = function () {
  return {
    get(prop: string) {
      return (globalThis as any)._campaignState[String(prop || "")];
    },
    set(prop: any, value?: any) {
      if (prop && typeof prop === "object") {
        Object.keys(prop).forEach((key) => {
          (globalThis as any)._campaignState[key] = prop[key];
        });
      } else {
        (globalThis as any)._campaignState[String(prop || "")] = value;
      }
    }
  };
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
  (globalThis as any)._gmIds = new Set<string>(["GM"]);
  (globalThis as any)._roll20Objects = {};
  (globalThis as any)._roll20IdCounter = 1;
  (globalThis as any)._campaignState = { playerpageid: "", playerspecificpages: {} };
};
