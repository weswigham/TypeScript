//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid432750.ts] ////

//// [input.ts]
const a: Foo<number> = new Foo;

//// [input.ts]
const a = new Foo<number>();
