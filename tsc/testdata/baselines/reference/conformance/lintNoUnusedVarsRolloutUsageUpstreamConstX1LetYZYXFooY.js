//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstX1LetYZYXFooY.ts] ////

//// [globals.d.ts]

//// [input.ts]
const x = 1; let y; ({z: [y = x]} = {}); foo(y);

//// [input.ts]
const x = 1; let y; ({z: [y = x]} = {}); foo(y);
