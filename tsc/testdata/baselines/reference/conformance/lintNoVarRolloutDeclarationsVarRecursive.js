//// [tests/cases/conformance/lint/rules/no-var/lintNoVarRolloutDeclarationsVarRecursive.ts] ////

//// [input.ts]
function f() { var x = () => x(); }

//// [input.ts]
function f() { let x = () => x(); }
