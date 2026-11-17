//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstABCItemsConsoleLogACCase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
const [ [a, _b, c] ] = items;
console.log(a+c);

//// [input.ts]
const [ [a, _b, c] ] = items;
console.log(a+c);
