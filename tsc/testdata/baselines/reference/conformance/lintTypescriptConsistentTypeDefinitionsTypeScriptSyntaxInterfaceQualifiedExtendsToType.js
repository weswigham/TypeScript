//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxInterfaceQualifiedExtendsToType.ts] ////

//// [input.ts]
interface Item extends NS.Base<string> {}

//// [input.ts]
type Item = {} & NS.Base<string>
