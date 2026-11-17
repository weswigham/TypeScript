//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarX1VarYXFooYCase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
var x = 1; var [y = x] = []; foo(y);

//// [input.ts]
var x = 1; var [y = x] = []; foo(y);
