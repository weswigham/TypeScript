//// [tests/cases/conformance/lint/rules/prefer-nullish-coalescing/lintTypescriptPreferNullishCoalescingFinalBooleanNullishDeclareConstValueStringNullValueFalseTrue.ts] ////

//// [input.ts]
declare const value: string | null; value || false && true;

//// [input.ts]
declare const value: string | null; value || false && true;
