//// [tests/cases/conformance/lint/rules/use-unknown-in-catch-callback-variable/tsUseUnknownInCatchCallbackVariableTypedC.ts] ////

//// [input.ts]
Promise.resolve().catch(error => {});
Promise.resolve().catch((error: unknown) => {});
Promise.resolve().catch((...errors: [unknown]) => {});
Promise.resolve().then(() => {}, (error: Error) => {});
declare const flag: boolean;
Promise.resolve().catch(flag ? error => {} : error => {});

//// [input.ts]
Promise.resolve().catch(error => {});
Promise.resolve().catch((error: unknown) => {});
Promise.resolve().catch((...errors: [unknown]) => {});
Promise.resolve().then(() => {}, (error: Error) => {});
declare const flag: boolean;
Promise.resolve().catch(flag ? error => {} : error => {});
