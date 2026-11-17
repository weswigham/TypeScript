//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarFirstItemIgnoredSecondItemItemsConsoleLogSecondItem.ts] ////

//// [globals.d.ts]

//// [input.ts]
var [ firstItemIgnored, secondItem ] = items;
console.log(secondItem);

//// [input.ts]
var [ firstItemIgnored, secondItem ] = items;
console.log(secondItem);
