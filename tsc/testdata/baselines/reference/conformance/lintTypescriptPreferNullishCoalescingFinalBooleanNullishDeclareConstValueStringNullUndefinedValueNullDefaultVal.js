//// [tests/cases/conformance/lint/rules/prefer-nullish-coalescing/lintTypescriptPreferNullishCoalescingFinalBooleanNullishDeclareConstValueStringNullUndefinedValueNullDefaultVal.ts] ////

//// [input.ts]
declare const value: string | null | undefined; value === null ? 'default' : value;

//// [input.ts]
declare const value: string | null | undefined; value === null ? 'default' : value;
