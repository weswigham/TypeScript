//// [tests/cases/conformance/lint/rules/prefer-nullish-coalescing/lintTypescriptPreferNullishCoalescingFinalBooleanNullishDeclareConstValueStringNullIfValueDefault01.ts] ////

//// [input.ts]
declare const value: string | null; if (value || 'default') {}

//// [input.ts]
declare const value: string | null; if (value || 'default') {}
