//// [tests/cases/conformance/lint/rules/use-unknown-in-catch-callback-variable/lintTypescriptUseUnknownInCatchCallbackVariableTypedCCatchDeclareConstCallbackErrorAnyVoidPromiseResolveCatchCa.ts] ////

//// [input.ts]
declare const callback: (error: any) => void; Promise.resolve().catch(callback);

//// [input.ts]
declare const callback: (error: any) => void; Promise.resolve().catch(callback);
