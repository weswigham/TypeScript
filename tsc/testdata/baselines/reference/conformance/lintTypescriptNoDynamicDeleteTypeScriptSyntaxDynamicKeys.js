//// [tests/cases/conformance/lint/rules/no-dynamic-delete/lintTypescriptNoDynamicDeleteTypeScriptSyntaxDynamicKeys.ts] ////

//// [input.ts]
delete value[key]; delete value['key']; delete value[-1]; delete value[`key`];

//// [input.ts]
delete value[key]; delete value['key']; delete value[-1]; delete value[`key`];
