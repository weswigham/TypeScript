//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstX1ConstZYXFooY.ts] ////

//// [globals.d.ts]

//// [input.ts]
const x = 1; const {z: [y = x]} = {}; foo(y);

//// [input.ts]
const x = 1; const {z: [y = x]} = {}; foo(y);
