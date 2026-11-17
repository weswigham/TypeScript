//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxTypeHeaderAndMemberComments.ts] ////

//// [input.ts]
type Item<T = { value: string }> /* header */ = (({ /* member */ value: T }));

//// [input.ts]
interface Item<T = { value: string }> /* header */ { /* member */ value: T }
