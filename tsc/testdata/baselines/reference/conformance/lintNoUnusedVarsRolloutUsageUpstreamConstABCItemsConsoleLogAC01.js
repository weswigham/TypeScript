//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstABCItemsConsoleLogAC01.ts] ////

//// [globals.d.ts]

//// [input.ts]
const [ a, _b, c ] = items;
console.log(a+c);

//// [input.ts]
const [ a, _b, c ] = items;
console.log(a+c);
