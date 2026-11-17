//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstABItemsConsoleLogAB.ts] ////

//// [globals.d.ts]

//// [input.ts]
const [ a, _b ] = items;
console.log(a+_b);

//// [input.ts]
const [ a, _b ] = items;
console.log(a+_b);
