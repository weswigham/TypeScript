//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstArrayABCDEConstABCArray.ts] ////

//// [globals.d.ts]

//// [input.ts]
const array = ['a', 'b', 'c', 'd', 'e']; const [a, _b, c] = array;

//// [input.ts]
const array = ['a', 'b', 'c', 'd', 'e']; const [a, _b, c] = array;
