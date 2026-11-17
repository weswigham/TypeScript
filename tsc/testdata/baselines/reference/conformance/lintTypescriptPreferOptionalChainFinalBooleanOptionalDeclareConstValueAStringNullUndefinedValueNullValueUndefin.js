//// [tests/cases/conformance/lint/rules/prefer-optional-chain/lintTypescriptPreferOptionalChainFinalBooleanOptionalDeclareConstValueAStringNullUndefinedValueNullValueUndefin.ts] ////

//// [input.ts]
declare const value: { a: string } | null | undefined; value !== null && value !== undefined && value.a;

//// [input.ts]
declare const value: { a: string } | null | undefined; value !== null && value !== undefined && value.a;
