//// [tests/cases/conformance/lint/rules/prefer-nullish-coalescing/lintTypescriptPreferNullishCoalescingFinalBooleanNullishDeclareConstValueStringNullUndefinedValueNullValueUndef.ts] ////

//// [input.ts]
declare const value: string | null | undefined; value !== null && value !== undefined ? value : 'default';

//// [input.ts]
declare const value: string | null | undefined; value !== null && value !== undefined ? value : 'default';
