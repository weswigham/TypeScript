//// [tests/cases/conformance/lint/rules/use-unknown-in-catch-callback-variable/lintTypescriptUseUnknownInCatchCallbackVariableTypedCCatchDeclareConstFlagBooleanPromiseResolveCatchFlagErrorEr.ts] ////

//// [input.ts]
declare const flag: boolean; Promise.resolve().catch(flag ? error => {} : error => {});

//// [input.ts]
declare const flag: boolean; Promise.resolve().catch(flag ? error => {} : error => {});
