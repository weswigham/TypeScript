//// [tests/cases/conformance/lint/rules/no-var/lintNoVarRolloutDeclarationsVarLoopUninitialized.ts] ////

//// [input.ts]
function f() { while (ok) { var x; consume(x); } }

//// [input.ts]
function f() { while (ok) { var x; consume(x); } }
