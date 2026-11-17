//// [tests/cases/conformance/lint/rules/block-scoped-var/lintBlockScopedVarCoreScopeABlockAndNativeVarKeyValueObjectUseValue.ts] ////

//// [input.ts]
{ var { key: value } = object; } use(value);

//// [input.ts]
{ var { key: value } = object; } use(value);
