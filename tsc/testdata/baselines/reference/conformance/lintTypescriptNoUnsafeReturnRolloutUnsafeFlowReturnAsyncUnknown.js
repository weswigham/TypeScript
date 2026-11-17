//// [tests/cases/conformance/lint/rules/no-unsafe-return/lintTypescriptNoUnsafeReturnRolloutUnsafeFlowReturnAsyncUnknown.ts] ////

//// [input.ts]
async function get(): Promise<unknown> { return Promise.resolve(1 as any); }

//// [input.ts]
async function get(): Promise<unknown> { return Promise.resolve(1 as any); }
