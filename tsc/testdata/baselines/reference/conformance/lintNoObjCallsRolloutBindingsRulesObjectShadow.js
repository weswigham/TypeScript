//// [tests/cases/conformance/lint/rules/no-obj-calls/lintNoObjCallsRolloutBindingsRulesObjectShadow.ts] ////

//// [input.ts]
function task(Math) { Math(); } { let JSON; new JSON(); } const other = {Math}; other.Math();

//// [input.ts]
function task(Math) { Math(); } { let JSON; new JSON(); } const other = {Math}; other.Math();
