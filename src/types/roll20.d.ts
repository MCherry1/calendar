// Roll20 API global type declarations.
// These globals are provided by the Roll20 sandbox at runtime
// and by test/roll20-shim.ts during testing.

declare var state: Record<string, any>;
declare function sendChat(speakingAs: string, message: string, callback?: any, options?: any): void;
declare function on(event: string, handler: (...args: any[]) => void): void;
declare function log(message: any): void;
declare function randomInteger(max: number): number;
declare function playerIsGM(playerId: string): boolean;

// Test-mode flag set by roll20-shim
declare var __CALENDAR_TEST_MODE__: boolean | undefined;

// Test helpers set by roll20-shim
declare var _chatLog: Array<{ who: string; msg: string }>;
declare var _eventHandlers: Record<string, Array<(...args: any[]) => void>>;
declare var _logMessages: any[];
declare function _resetShim(): void;
