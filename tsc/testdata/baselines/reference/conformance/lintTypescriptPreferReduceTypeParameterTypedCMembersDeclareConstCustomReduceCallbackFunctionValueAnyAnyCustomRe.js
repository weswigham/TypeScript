//// [tests/cases/conformance/lint/rules/prefer-reduce-type-parameter/lintTypescriptPreferReduceTypeParameterTypedCMembersDeclareConstCustomReduceCallbackFunctionValueAnyAnyCustomRe.ts] ////

//// [input.ts]
declare const custom: { reduce(callback: Function, value: any): any }; custom.reduce(() => {}, {} as any);

//// [input.ts]
declare const custom: { reduce(callback: Function, value: any): any }; custom.reduce(() => {}, {} as any);
