//// [tests/cases/conformance/lint/rules/use-unknown-in-catch-callback-variable/lintTypescriptUseUnknownInCatchCallbackVariableTypedCSuggestionsPromiseResolveCatchErrorsString.ts] ////

//// [input.ts]
Promise.resolve().catch((...errors: string[]) => {});

//// [input.ts]
Promise.resolve().catch((...errors: string[]) => {});
