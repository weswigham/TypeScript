//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamLetFooRestFooRestSomethingConsoleLogRest.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo, rest;
({ foo, ...rest } = something);
console.log(rest);

//// [input.ts]
let foo, rest;
({ foo, ...rest } = something);
console.log(rest);
