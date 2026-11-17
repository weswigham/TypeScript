//// [tests/cases/conformance/lint/rules/no-unsafe-return/lintTypescriptNoUnsafeReturnRolloutUnsafeFlowReturnAsyncAnnotated.ts] ////

//// [input.ts]
async function get(): Promise<any> { return Promise.resolve(1 as any); }

//// [input.ts]
async function get(): Promise<any> { return Promise.resolve(1 as any); }
