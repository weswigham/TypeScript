//// [tests/cases/conformance/lint/rules/consistent-return/lintTypescriptConsistentReturnFinalSimplifyReturnAsyncFunctionFFlagBooleanPromiseVoidIfFlagReturnPromiseResolve.ts] ////

//// [input.ts]
async function f(flag: boolean): Promise<void> { if (flag) return Promise.resolve(); return; }

//// [input.ts]
async function f(flag: boolean): Promise<void> { if (flag) return Promise.resolve(); return; }
