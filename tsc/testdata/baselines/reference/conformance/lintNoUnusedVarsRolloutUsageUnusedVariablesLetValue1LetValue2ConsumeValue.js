//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUnusedVariablesLetValue1LetValue2ConsumeValue.ts] ////

//// [globals.d.ts]

//// [input.ts]
let value = 1; { let value = 2; consume(value); }

//// [input.ts]
let value = 1; { let value = 2; consume(value); }
