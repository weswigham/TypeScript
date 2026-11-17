//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamLetBarHelloAFooAlertBar.ts] ////

//// [globals.d.ts]

//// [input.ts]
let bar = 'hello', { a } = foo; alert(bar);

//// [input.ts]
let bar = 'hello', { a } = foo; alert(bar);
