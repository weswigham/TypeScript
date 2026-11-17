//// [tests/cases/conformance/lint/rules/no-var/lintNoVarRolloutDeclarationsVarLoopClosure.ts] ////

//// [input.ts]
function f() { for (var x of values) callbacks.push(() => x); }

//// [input.ts]
function f() { for (var x of values) callbacks.push(() => x); }
