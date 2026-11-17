//// [tests/cases/conformance/lint/rules/strict-void-return/lintTypescriptStrictVoidReturnFinalValuesOptionsAndRangesStrictOverloadAllowed.ts] ////

//// [input.ts]
declare function fn(cb: () => void): void; declare function fn(cb: () => boolean): void; fn(() => false);

//// [input.ts]
declare function fn(cb: () => void): void; declare function fn(cb: () => boolean): void; fn(() => false);
