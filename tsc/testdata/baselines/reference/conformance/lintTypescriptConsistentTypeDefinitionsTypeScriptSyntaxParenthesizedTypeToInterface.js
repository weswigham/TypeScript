//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxParenthesizedTypeToInterface.ts] ////

//// [input.ts]
type Item = (({ value: number }));

//// [input.ts]
interface Item { value: number }
