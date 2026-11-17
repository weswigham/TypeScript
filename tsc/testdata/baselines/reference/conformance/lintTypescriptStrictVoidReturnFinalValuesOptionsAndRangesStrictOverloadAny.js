//// [tests/cases/conformance/lint/rules/strict-void-return/lintTypescriptStrictVoidReturnFinalValuesOptionsAndRangesStrictOverloadAny.ts] ////

//// [input.ts]
declare function fn(cb: () => any): void; declare function fn(cb: () => void): void; fn(() => false);

//// [input.ts]
declare function fn(cb: () => any): void; declare function fn(cb: () => void): void; fn(() => false);
