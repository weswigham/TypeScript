//// [tests/cases/conformance/lint/rules/block-scoped-var/lintBlockScopedVarCoreScopeABlockAndNativeVarValueValue1FunctionNestedUseValue.ts] ////

//// [input.ts]
var value; { value = 1; function nested() { use(value); } }

//// [input.ts]
var value; { value = 1; function nested() { use(value); } }
