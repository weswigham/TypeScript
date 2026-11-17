//// [tests/cases/conformance/lint/rules/prefer-nullish-coalescing/lintTypescriptPreferNullishCoalescingFinalBooleanNullishDeclareConstValueStringNullBooleanValueDefault.ts] ////

//// [input.ts]
declare const value: string | null; Boolean(value || 'default');

//// [input.ts]
declare const value: string | null; Boolean(value || 'default');
