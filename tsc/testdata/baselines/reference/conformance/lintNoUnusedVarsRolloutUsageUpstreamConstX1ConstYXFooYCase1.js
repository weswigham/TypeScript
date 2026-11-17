//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstX1ConstYXFooYCase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
const x = 1; const [y = x] = []; foo(y);

//// [input.ts]
const x = 1; const [y = x] = []; foo(y);
