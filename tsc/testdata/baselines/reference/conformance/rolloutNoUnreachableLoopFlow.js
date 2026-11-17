//// [tests/cases/conformance/lint/rules/no-unreachable-loop/rolloutNoUnreachableLoopFlow.ts] ////

//// [input.ts]
declare const items: unknown[], flag: boolean;
declare function work(): void;
function once() { for (const item of items) { return item; } }
function repeat() { for (const item of items) { if (item) continue; break; } }
function nested() { outer: while (flag) { do { break outer; } while (flag); } }
function finallyStops() { while (flag) { try { work(); } finally { break; } } }
function catchRepeats() { while (flag) { try { return work(); } catch {} } }

//// [input.ts]
declare const items: unknown[], flag: boolean;
declare function work(): void;
function once() { for (const item of items) { return item; } }
function repeat() { for (const item of items) { if (item) continue; break; } }
function nested() { outer: while (flag) { do { break outer; } while (flag); } }
function finallyStops() { while (flag) { try { work(); } finally { break; } } }
function catchRepeats() { while (flag) { try { return work(); } catch {} } }
