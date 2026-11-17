//// [tests/cases/conformance/lint/rules/no-var/lintNoVarRolloutDeclarationsVarSimple.ts] ////

//// [input.ts]
function f() { var x = 1; return x; }

//// [input.ts]
function f() { let x = 1; return x; }
