//// [tests/cases/conformance/lint/rules/no-var/lintNoVarRolloutDeclarationsVarNestedCatch.ts] ////

//// [input.ts]
function f() { try {} catch (x) { { var x = 1; } } }

//// [input.ts]
function f() { try {} catch (x) { { var x = 1; } } }
