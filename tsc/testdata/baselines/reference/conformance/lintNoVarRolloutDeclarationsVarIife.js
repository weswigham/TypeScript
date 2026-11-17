//// [tests/cases/conformance/lint/rules/no-var/lintNoVarRolloutDeclarationsVarIife.ts] ////

//// [input.ts]
function f() { var x = (() => x())(); }

//// [input.ts]
function f() { var x = (() => x())(); }
