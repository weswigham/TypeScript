//// [tests/cases/conformance/lint/rules/no-unsafe-return/lintTypescriptNoUnsafeReturnRolloutUnsafeFlowReturnAsyncAny.ts] ////

//// [input.ts]
async function get() { return Promise.resolve(1 as any); }

//// [input.ts]
async function get() { return Promise.resolve(1 as any); }
