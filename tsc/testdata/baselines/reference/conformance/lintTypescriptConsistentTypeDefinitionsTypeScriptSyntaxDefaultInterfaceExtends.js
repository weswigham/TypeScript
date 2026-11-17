//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxDefaultInterfaceExtends.ts] ////

//// [input.ts]
export default interface Item<T> extends Base<T> {}

//// [input.ts]
type Item<T> = {} & Base<T>
export default Item
