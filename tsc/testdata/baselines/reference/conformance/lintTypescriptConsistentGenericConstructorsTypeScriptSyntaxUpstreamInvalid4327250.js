//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid4327250.ts] ////

//// [input.ts]
const a = new Foo</* comment */ string, /* another */ number>();

//// [input.ts]
const a: Foo</* comment */ string, /* another */ number> = new Foo();
