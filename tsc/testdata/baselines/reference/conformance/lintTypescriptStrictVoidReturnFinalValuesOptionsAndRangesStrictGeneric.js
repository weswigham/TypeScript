//// [tests/cases/conformance/lint/rules/strict-void-return/lintTypescriptStrictVoidReturnFinalValuesOptionsAndRangesStrictGeneric.ts] ////

//// [input.ts]
declare function fn<T extends () => void>(cb: T): void; fn(() => 1);

//// [input.ts]
declare function fn<T extends () => void>(cb: T): void; fn(() => 1);
