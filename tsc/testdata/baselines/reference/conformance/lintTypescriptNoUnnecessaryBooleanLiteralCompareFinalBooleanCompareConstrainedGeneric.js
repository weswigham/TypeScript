//// [tests/cases/conformance/lint/rules/no-unnecessary-boolean-literal-compare/lintTypescriptNoUnnecessaryBooleanLiteralCompareFinalBooleanCompareConstrainedGeneric.ts] ////

//// [input.ts]
function test<T extends boolean>(value: T) { return value !== false; }

//// [input.ts]
function test<T extends boolean>(value: T) { return value; }
