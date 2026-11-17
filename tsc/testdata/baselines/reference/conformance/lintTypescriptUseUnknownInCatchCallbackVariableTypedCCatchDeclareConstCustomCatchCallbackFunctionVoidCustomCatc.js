//// [tests/cases/conformance/lint/rules/use-unknown-in-catch-callback-variable/lintTypescriptUseUnknownInCatchCallbackVariableTypedCCatchDeclareConstCustomCatchCallbackFunctionVoidCustomCatc.ts] ////

//// [input.ts]
declare const custom: { catch(callback: Function): void }; custom.catch(error => {});

//// [input.ts]
declare const custom: { catch(callback: Function): void }; custom.catch(error => {});
