//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstABArrayAlertB.ts] ////

//// [globals.d.ts]

//// [input.ts]
const [a, ...[b]] = array; alert(b);

//// [input.ts]
const [a, ...[b]] = array; alert(b);
