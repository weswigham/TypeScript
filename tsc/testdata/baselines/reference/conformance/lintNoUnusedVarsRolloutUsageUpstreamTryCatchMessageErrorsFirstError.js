//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamTryCatchMessageErrorsFirstError.ts] ////

//// [globals.d.ts]

//// [input.ts]
try {} catch ({ message, errors: [firstError] }) {}

//// [input.ts]
try {} catch ({ message, errors: [firstError] }) {}
