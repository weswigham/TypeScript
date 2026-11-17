//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamLetAFooBarHelloAlertBar.ts] ////

//// [globals.d.ts]

//// [input.ts]
let { a } = foo, bar = 'hello'; alert(bar);

//// [input.ts]
let { a } = foo, bar = 'hello'; alert(bar);
