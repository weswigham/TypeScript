//// [tests/cases/conformance/lint/rules/block-scoped-var/lintBlockScopedVarCoreScopeABlockAndNativeVarValueConstObjectValueExportValueAsRenamed.ts] ////

//// [input.ts]
{ var value; } const object = { value }; export { value as renamed };

//// [input.ts]
{ var value; } const object = { value }; export { value as renamed };
