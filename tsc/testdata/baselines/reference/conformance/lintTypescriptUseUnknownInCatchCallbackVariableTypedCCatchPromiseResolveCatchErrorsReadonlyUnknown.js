//// [tests/cases/conformance/lint/rules/use-unknown-in-catch-callback-variable/lintTypescriptUseUnknownInCatchCallbackVariableTypedCCatchPromiseResolveCatchErrorsReadonlyUnknown.ts] ////

//// [input.ts]
Promise.resolve().catch((...errors: readonly unknown[]) => {});

//// [input.ts]
Promise.resolve().catch((...errors: readonly unknown[]) => {});
