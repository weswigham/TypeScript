//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxInterfaceExtendsToType.ts] ////

//// [input.ts]
interface Item<T> extends Base<T>, Other {}

//// [input.ts]
type Item<T> = {} & Base<T> & Other
