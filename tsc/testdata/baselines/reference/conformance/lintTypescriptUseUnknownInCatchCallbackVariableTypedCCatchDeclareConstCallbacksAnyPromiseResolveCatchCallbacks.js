//// [tests/cases/conformance/lint/rules/use-unknown-in-catch-callback-variable/lintTypescriptUseUnknownInCatchCallbackVariableTypedCCatchDeclareConstCallbacksAnyPromiseResolveCatchCallbacks.ts] ////

//// [input.ts]
declare const callbacks: any[]; Promise.resolve().catch(...callbacks);

//// [input.ts]
declare const callbacks: any[]; Promise.resolve().catch(...callbacks);
