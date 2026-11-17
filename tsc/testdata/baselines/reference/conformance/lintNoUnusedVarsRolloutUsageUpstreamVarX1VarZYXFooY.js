//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarX1VarZYXFooY.ts] ////

//// [globals.d.ts]

//// [input.ts]
var x = 1; var {z: [y = x]} = {}; foo(y);

//// [input.ts]
var x = 1; var {z: [y = x]} = {}; foo(y);
