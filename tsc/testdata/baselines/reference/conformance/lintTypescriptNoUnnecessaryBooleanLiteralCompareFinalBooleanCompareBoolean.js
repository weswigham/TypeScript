//// [tests/cases/conformance/lint/rules/no-unnecessary-boolean-literal-compare/lintTypescriptNoUnnecessaryBooleanLiteralCompareFinalBooleanCompareBoolean.ts] ////

//// [input.ts]
declare const value: boolean; value === true;

//// [input.ts]
declare const value: boolean; value;
