//// [tests/cases/conformance/lint/rules/use-unknown-in-catch-callback-variable/lintTypescriptUseUnknownInCatchCallbackVariableTypedCCatchPromiseResolveCatchErrorsUnknown.ts] ////

//// [input.ts]
Promise.resolve().catch((...errors: [unknown]) => {});

//// [input.ts]
Promise.resolve().catch((...errors: [unknown]) => {});
