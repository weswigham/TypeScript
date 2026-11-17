//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarX1YYXFooY.ts] ////

//// [globals.d.ts]

//// [input.ts]
var x = 1, y; [y = x] = []; foo(y);

//// [input.ts]
var x = 1, y; [y = x] = []; foo(y);
