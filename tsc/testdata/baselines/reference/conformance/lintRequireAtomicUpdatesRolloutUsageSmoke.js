//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageSmoke.ts] ////

//// [globals.d.ts]

//// [input.ts]
let value = 0; async function run() { value += await work(); }

//// [input.ts]
let value = 0; async function run() { value += await work(); }
