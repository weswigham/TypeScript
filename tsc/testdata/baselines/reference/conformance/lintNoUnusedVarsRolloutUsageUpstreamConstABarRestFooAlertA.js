//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstABarRestFooAlertA.ts] ////

//// [globals.d.ts]

//// [input.ts]
const a = bar, {...rest} = foo; alert(a);

//// [input.ts]
const a = bar, {...rest} = foo; alert(a);
