//// [tests/cases/conformance/lint/rules/no-var/lintNoVarRolloutDeclarationsVarLoop.ts] ////

//// [input.ts]
function f() { for (var x of values) consume(x); }

//// [input.ts]
function f() { for (let x of values) consume(x); }
