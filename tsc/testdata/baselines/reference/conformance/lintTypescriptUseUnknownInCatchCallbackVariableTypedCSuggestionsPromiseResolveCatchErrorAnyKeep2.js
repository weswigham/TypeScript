//// [tests/cases/conformance/lint/rules/use-unknown-in-catch-callback-variable/lintTypescriptUseUnknownInCatchCallbackVariableTypedCSuggestionsPromiseResolveCatchErrorAnyKeep2.ts] ////

//// [input.ts]
Promise.resolve().catch((error: any /* keep */ = 2) => {});

//// [input.ts]
Promise.resolve().catch((error: any /* keep */ = 2) => {});
