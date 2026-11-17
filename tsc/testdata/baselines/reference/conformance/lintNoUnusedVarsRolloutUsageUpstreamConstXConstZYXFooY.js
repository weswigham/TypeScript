//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstXConstZYXFooY.ts] ////

//// [globals.d.ts]

//// [input.ts]
const x = []; const {z: [y] = x} = {}; foo(y);

//// [input.ts]
const x = []; const {z: [y] = x} = {}; foo(y);
