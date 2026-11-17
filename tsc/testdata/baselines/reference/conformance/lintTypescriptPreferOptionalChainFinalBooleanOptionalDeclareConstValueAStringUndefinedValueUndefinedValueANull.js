//// [tests/cases/conformance/lint/rules/prefer-optional-chain/lintTypescriptPreferOptionalChainFinalBooleanOptionalDeclareConstValueAStringUndefinedValueUndefinedValueANull.ts] ////

//// [input.ts]
declare const value: { a: string } | undefined; value === undefined || value.a === null;

//// [input.ts]
declare const value: { a: string } | undefined; value === undefined || value.a === null;
