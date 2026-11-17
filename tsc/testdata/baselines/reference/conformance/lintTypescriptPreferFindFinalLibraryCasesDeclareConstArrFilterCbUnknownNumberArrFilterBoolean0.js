//// [tests/cases/conformance/lint/rules/prefer-find/lintTypescriptPreferFindFinalLibraryCasesDeclareConstArrFilterCbUnknownNumberArrFilterBoolean0.ts] ////

//// [input.ts]
declare const arr: {filter(cb: unknown): number[]}; arr.filter(Boolean)[0];

//// [input.ts]
declare const arr: {filter(cb: unknown): number[]}; arr.filter(Boolean)[0];
