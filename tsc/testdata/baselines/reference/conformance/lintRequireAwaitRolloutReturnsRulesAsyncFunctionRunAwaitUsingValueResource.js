//// [tests/cases/conformance/lint/rules/require-await/lintRequireAwaitRolloutReturnsRulesAsyncFunctionRunAwaitUsingValueResource.ts] ////

//// [input.ts]
async function run() { await using value = resource; }

//// [input.ts]
async function run() { await using value = resource; }
