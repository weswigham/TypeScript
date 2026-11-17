//// [tests/cases/conformance/lint/rules/no-unnecessary-boolean-literal-compare/lintTypescriptNoUnnecessaryBooleanLiteralCompareFinalBooleanCompareNullableEnabled.ts] ////

//// [input.ts]
declare const value: boolean | undefined; value === true;

//// [input.ts]
declare const value: boolean | undefined; value ?? false;
