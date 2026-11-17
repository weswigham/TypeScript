//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstX1LetYYXFooY.ts] ////

//// [globals.d.ts]

//// [input.ts]
const x = 1; let y; [y = x] = []; foo(y);

//// [input.ts]
const x = 1; let y; [y = x] = []; foo(y);
