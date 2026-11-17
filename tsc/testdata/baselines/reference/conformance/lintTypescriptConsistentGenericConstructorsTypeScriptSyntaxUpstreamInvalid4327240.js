//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid4327240.ts] ////

//// [input.ts]
const a = new Foo/* comment */ <string> /* another */();

//// [input.ts]
const a: Foo<string> = new Foo/* comment */  /* another */();
