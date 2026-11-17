//// [tests/cases/conformance/lint/rules/prefer-optional-chain/lintTypescriptPreferOptionalChainFinalBooleanOptionalDeclareConstValueAStringNullValueValueA01.ts] ////

//// [input.ts]
declare const value: { a: string } | null; value && value.a;

//// [input.ts]
declare const value: { a: string } | null; value?.a;
