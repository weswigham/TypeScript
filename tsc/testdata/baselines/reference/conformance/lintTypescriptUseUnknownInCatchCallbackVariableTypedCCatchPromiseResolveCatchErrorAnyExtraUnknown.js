//// [tests/cases/conformance/lint/rules/use-unknown-in-catch-callback-variable/lintTypescriptUseUnknownInCatchCallbackVariableTypedCCatchPromiseResolveCatchErrorAnyExtraUnknown.ts] ////

//// [input.ts]
Promise.resolve().catch((error: any, extra: unknown) => {});

//// [input.ts]
Promise.resolve().catch((error: any, extra: unknown) => {});
