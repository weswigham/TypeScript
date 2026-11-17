//// [tests/cases/conformance/lint/rules/no-unsafe-return/lintTypescriptNoUnsafeReturnRolloutUnsafeFlowReturnNonasyncPromise.ts] ////

//// [input.ts]
function get() { return Promise.resolve(1 as any); }

//// [input.ts]
function get() { return Promise.resolve(1 as any); }
