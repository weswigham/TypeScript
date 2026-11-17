//// [tests/cases/conformance/lint/rules/non-nullable-type-assertion-style/lintTypescriptNonNullableTypeAssertionStyleTypedBRedundantDeclareConstValueStringNullValueAsString.ts] ////

//// [input.ts]
declare const value: string | null; value as string;

//// [input.ts]
declare const value: string | null; value!;
