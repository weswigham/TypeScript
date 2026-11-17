//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamLetABFooForEachItemABItem.ts] ////

//// [globals.d.ts]

//// [input.ts]
let _a, b; foo.forEach(item => { [a, b] = item; });

//// [input.ts]
let _a, b; foo.forEach(item => { [a, b] = item; });
