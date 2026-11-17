//// [tests/cases/conformance/lint/rules/strict-void-return/lintTypescriptStrictVoidReturnFinalValuesOptionsAndRangesStrictRest.ts] ////

//// [input.ts]
declare function fn(...cb: (() => void)[]): void; fn(() => {}, () => false);

//// [input.ts]
declare function fn(...cb: (() => void)[]): void; fn(() => {}, () => false);
