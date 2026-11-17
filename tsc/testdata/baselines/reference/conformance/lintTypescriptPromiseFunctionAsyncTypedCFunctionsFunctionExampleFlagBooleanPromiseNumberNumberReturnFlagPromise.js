//// [tests/cases/conformance/lint/rules/promise-function-async/lintTypescriptPromiseFunctionAsyncTypedCFunctionsFunctionExampleFlagBooleanPromiseNumberNumberReturnFlagPromise.ts] ////

//// [input.ts]
function example(flag: boolean): Promise<number> | number { return flag ? Promise.resolve(1) : 1; }

//// [input.ts]
function example(flag: boolean): Promise<number> | number { return flag ? Promise.resolve(1) : 1; }
