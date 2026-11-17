//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarX1YZYXFooY.ts] ////

//// [globals.d.ts]

//// [input.ts]
var x = 1, y; ({z: [y = x]} = {}); foo(y);

//// [input.ts]
var x = 1, y; ({z: [y = x]} = {}); foo(y);
