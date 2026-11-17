//// [tests/cases/conformance/lint/rules/prefer-nullish-coalescing/lintTypescriptPreferNullishCoalescingFinalBooleanNullishDeclareConstValueStringNullValueNullDefaultValue.ts] ////

//// [input.ts]
declare const value: string | null; value == null ? 'default' : value;

//// [input.ts]
declare const value: string | null; value == null ? 'default' : value;
