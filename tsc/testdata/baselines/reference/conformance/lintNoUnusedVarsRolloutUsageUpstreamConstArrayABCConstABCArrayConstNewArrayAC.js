//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstArrayABCConstABCArrayConstNewArrayAC.ts] ////

//// [globals.d.ts]

//// [input.ts]
const array = ['a', 'b', 'c']; const [a, _b, c] = array; const newArray = [a, c];

//// [input.ts]
const array = ['a', 'b', 'c']; const [a, _b, c] = array; const newArray = [a, c];
