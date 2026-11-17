//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstAADefaultBFooAlertBCase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
const [a = aDefault, b] = foo; alert(b);

//// [input.ts]
const [a = aDefault, b] = foo; alert(b);
