//// [tests/cases/conformance/lint/rules/use-unknown-in-catch-callback-variable/lintTypescriptUseUnknownInCatchCallbackVariableTypedCCatchLetMethodCatchPromiseResolveMethodErrorError.ts] ////

//// [input.ts]
let method = 'catch'; Promise.resolve()[method]((error: Error) => {});

//// [input.ts]
let method = 'catch'; Promise.resolve()[method]((error: Error) => {});
