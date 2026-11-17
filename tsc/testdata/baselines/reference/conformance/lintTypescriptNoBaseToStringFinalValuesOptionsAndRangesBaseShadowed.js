//// [tests/cases/conformance/lint/rules/no-base-to-string/lintTypescriptNoBaseToStringFinalValuesOptionsAndRangesBaseShadowed.ts] ////

//// [input.ts]
function fn(String: (value: {}) => string) { String({}); }

//// [input.ts]
function fn(String: (value: {}) => string) { String({}); }
