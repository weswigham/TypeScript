//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxInterfaceGenericBracesAndSemicolon.ts] ////

//// [input.ts]
interface Item<T = { value: string }> extends Base<{ nested: T }> { /* member */ value: T };

//// [input.ts]
type Item<T = { value: string }> = { /* member */ value: T } & Base<{ nested: T }>;
