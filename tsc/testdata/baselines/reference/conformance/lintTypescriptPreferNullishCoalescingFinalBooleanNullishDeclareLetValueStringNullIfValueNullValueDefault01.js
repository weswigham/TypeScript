//// [tests/cases/conformance/lint/rules/prefer-nullish-coalescing/lintTypescriptPreferNullishCoalescingFinalBooleanNullishDeclareLetValueStringNullIfValueNullValueDefault01.ts] ////

//// [input.ts]
declare let value: string | null; if (value == null) value = 'default';

//// [input.ts]
declare let value: string | null; if (value == null) value = 'default';
