//// [tests/cases/conformance/lint/rules/require-yield/requireYieldCore.ts] ////

//// [input.ts]
function* missing() { return 0; }
function* empty() {}
function* outer() { function* inner() { yield 1; } }
function* yielding() { yield 1; }
const object = { *missing() { return 0; } };
class Example { *missing() { return 0; } }

//// [input.ts]
function* missing() { return 0; }
function* empty() {}
function* outer() { function* inner() { yield 1; } }
function* yielding() { yield 1; }
const object = { *missing() { return 0; } };
class Example { *missing() { return 0; } }
