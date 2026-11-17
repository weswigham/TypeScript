//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstXAFooBarConsoleLogFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
const { x: [_a, foo] } = bar;
console.log(foo);

//// [input.ts]
const { x: [_a, foo] } = bar;
console.log(foo);
