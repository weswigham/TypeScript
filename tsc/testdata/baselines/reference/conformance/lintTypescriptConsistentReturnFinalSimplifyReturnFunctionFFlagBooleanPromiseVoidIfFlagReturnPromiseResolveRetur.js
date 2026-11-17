//// [tests/cases/conformance/lint/rules/consistent-return/lintTypescriptConsistentReturnFinalSimplifyReturnFunctionFFlagBooleanPromiseVoidIfFlagReturnPromiseResolveRetur.ts] ////

//// [input.ts]
function f(flag: boolean): Promise<void> { if (flag) return Promise.resolve(); return; }

//// [input.ts]
function f(flag: boolean): Promise<void> { if (flag) return Promise.resolve(); return; }
