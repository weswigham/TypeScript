//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUnusedVariablesLetFirstRestFirstRestInputConsumeRest.ts] ////

//// [globals.d.ts]

//// [input.ts]
let first, rest; ({first, ...rest} = input); consume(rest);

//// [input.ts]
let first, rest; ({first, ...rest} = input); consume(rest);
