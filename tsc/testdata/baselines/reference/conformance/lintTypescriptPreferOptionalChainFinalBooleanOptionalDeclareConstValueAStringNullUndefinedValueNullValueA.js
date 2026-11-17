//// [tests/cases/conformance/lint/rules/prefer-optional-chain/lintTypescriptPreferOptionalChainFinalBooleanOptionalDeclareConstValueAStringNullUndefinedValueNullValueA.ts] ////

//// [input.ts]
declare const value: { a: string } | null | undefined; value !== null && value.a;

//// [input.ts]
declare const value: { a: string } | null | undefined; value !== null && value.a;
