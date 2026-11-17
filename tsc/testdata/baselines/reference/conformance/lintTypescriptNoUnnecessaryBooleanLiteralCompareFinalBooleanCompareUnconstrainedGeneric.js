//// [tests/cases/conformance/lint/rules/no-unnecessary-boolean-literal-compare/lintTypescriptNoUnnecessaryBooleanLiteralCompareFinalBooleanCompareUnconstrainedGeneric.ts] ////

//// [input.ts]
function test<T>(value: T) { return value !== false; }

//// [input.ts]
function test<T>(value: T) { return value !== false; }
