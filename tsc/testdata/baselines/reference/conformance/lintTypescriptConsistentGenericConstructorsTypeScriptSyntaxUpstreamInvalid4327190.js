//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid4327190.ts] ////

//// [input.ts]
const a = new Foo<string>();

//// [input.ts]
const a: Foo<string> = new Foo();
