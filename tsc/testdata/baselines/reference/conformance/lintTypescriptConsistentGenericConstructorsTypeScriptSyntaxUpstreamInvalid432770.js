//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid432770.ts] ////

//// [input.ts]
const a: Foo/* comment */ <string> = new Foo /* another */();

//// [input.ts]
const a = new Foo/* comment */<string> /* another */();
