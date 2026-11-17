//// [tests/cases/conformance/lint/rules/use-unknown-in-catch-callback-variable/lintTypescriptUseUnknownInCatchCallbackVariableTypedCCatchPromiseResolveCatchErrorUnknownCase1.ts] ////

//// [input.ts]
Promise.resolve().catch(([error]: [unknown]) => {});

//// [input.ts]
Promise.resolve().catch(([error]: [unknown]) => {});
