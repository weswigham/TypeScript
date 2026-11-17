//// [tests/cases/conformance/lint/rules/no-var/lintNoVarRolloutDeclarations.ts] ////

//// [input.ts]
function f() { var value = 1; return value; }

//// [input.ts]
function f() { let value = 1; return value; }
