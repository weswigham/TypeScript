//// [tests/cases/conformance/lint/rules/no-unreachable/rolloutNoUnreachableFlow.ts] ////

//// [input.ts]
declare function work(): void;
declare const flag: boolean;
function stopped() { return; work(); work(); }
function branches() { if (flag) { return; } else { throw 0; } work(); }
function finalized() { try { work(); } finally { return; } work(); }
function infinite() { while (true) {} work(); }
function hoisted() { return value; var value; }
function catchable() { try { work(); return; } catch { work(); } }

//// [input.ts]
declare function work(): void;
declare const flag: boolean;
function stopped() { return; work(); work(); }
function branches() { if (flag) { return; } else { throw 0; } work(); }
function finalized() { try { work(); } finally { return; } work(); }
function infinite() { while (true) {} work(); }
function hoisted() { return value; var value; }
function catchable() { try { work(); return; } catch { work(); } }
