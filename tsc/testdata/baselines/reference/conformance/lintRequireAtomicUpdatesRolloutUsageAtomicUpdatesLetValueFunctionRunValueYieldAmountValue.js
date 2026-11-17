//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageAtomicUpdatesLetValueFunctionRunValueYieldAmountValue.ts] ////

//// [globals.d.ts]

//// [input.ts]
let value; function* run() { value = (yield amount) + value; }

//// [input.ts]
let value; function* run() { value = (yield amount) + value; }
