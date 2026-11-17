//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid432760.ts] ////

//// [input.ts]
const a: /* comment */ Foo/* another */ <string> = new Foo();

//// [input.ts]
const a = new Foo/* comment *//* another */<string>();
