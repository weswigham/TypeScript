//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarXVarZYXFooY.ts] ////

//// [globals.d.ts]

//// [input.ts]
var x = []; var {z: [y] = x} = {}; foo(y);

//// [input.ts]
var x = []; var {z: [y] = x} = {}; foo(y);
