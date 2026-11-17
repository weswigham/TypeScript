//// [tests/cases/conformance/lint/rules/prefer-optional-chain/lintTypescriptPreferOptionalChainFinalBooleanOptionalDeclareConstValueAnyValueA1ValueA1B.ts] ////

//// [input.ts]
declare const value: any; value.a(1) && value.a(1).b;

//// [input.ts]
declare const value: any; value.a(1)?.b;
