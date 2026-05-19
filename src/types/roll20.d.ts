// Roll20 API global type declarations.
// These globals are provided by the Roll20 sandbox at runtime
// and by test/roll20-shim.ts during testing.

declare var state: Record<string, any>;
declare function sendChat(speakingAs: string, message: string, callback?: any, options?: any): void;
declare function on(event: string, handler: (...args: any[]) => void): void;
declare function log(message: any): void;
declare function randomInteger(max: number): number;
declare function playerIsGM(playerId: string): boolean;
declare function Campaign(): any;
declare function createObj(type: string, attributes: Record<string, any>): any;
declare function findObjs(attrs: Record<string, any>, options?: Record<string, any>): any[];
declare function getObj(type: string, id: string): any;

// Test-mode flag set by roll20-shim
declare var __CALENDAR_TEST_MODE__: boolean | undefined;

// Build-time flag injected by build.mjs (the Roll20 bundle). Undefined
// in tests and in the web build; truthy only inside the calendar.js
// IIFE that runs in the Roll20 sandbox. Used to gate computations that
// are too expensive for the Roll20 API timeout budget.
declare var __ROLL20__: boolean | undefined;

// Test helpers set by roll20-shim
declare var _chatLog: Array<{ who: string; msg: string; opts?: any }>;
declare var _eventHandlers: Record<string, Array<(...args: any[]) => void>>;
declare var _logMessages: any[];
declare var _roll20Objects: Record<string, any>;
declare var _campaignState: Record<string, any>;
declare function _resetShim(): void;
