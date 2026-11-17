//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarXYZYXFooY.ts] ////

//// [globals.d.ts]

//// [input.ts]
var x = [], y; ({z: [y] = x} = {}); foo(y);

//// [input.ts]
var x = [], y; ({z: [y] = x} = {}); foo(y);
