//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUnusedVariablesTryCatchErrorConsumeError.ts] ////

//// [globals.d.ts]

//// [input.ts]
try {} catch (_error) { consume(_error); }

//// [input.ts]
try {} catch (_error) { consume(_error); }
