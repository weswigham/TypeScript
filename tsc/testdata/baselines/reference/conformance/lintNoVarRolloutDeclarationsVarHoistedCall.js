//// [tests/cases/conformance/lint/rules/no-var/lintNoVarRolloutDeclarationsVarHoistedCall.ts] ////

//// [input.ts]
function f() { g(); var x = 1; function g() { return x; } }

//// [input.ts]
function f() { g(); var x = 1; function g() { return x; } }
