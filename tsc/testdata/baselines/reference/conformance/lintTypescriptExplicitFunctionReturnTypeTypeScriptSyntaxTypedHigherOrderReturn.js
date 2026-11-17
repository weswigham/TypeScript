//// [tests/cases/conformance/lint/rules/explicit-function-return-type/lintTypescriptExplicitFunctionReturnTypeTypeScriptSyntaxTypedHigherOrderReturn.ts] ////

//// [input.ts]
function outer(): () => number { return () => 1; }

//// [input.ts]
function outer(): () => number { return () => 1; }
