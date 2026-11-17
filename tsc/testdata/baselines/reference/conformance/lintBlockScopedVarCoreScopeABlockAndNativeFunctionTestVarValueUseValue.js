//// [tests/cases/conformance/lint/rules/block-scoped-var/lintBlockScopedVarCoreScopeABlockAndNativeFunctionTestVarValueUseValue.ts] ////

//// [input.ts]
function test() { { var value; } use(value); }

//// [input.ts]
function test() { { var value; } use(value); }
