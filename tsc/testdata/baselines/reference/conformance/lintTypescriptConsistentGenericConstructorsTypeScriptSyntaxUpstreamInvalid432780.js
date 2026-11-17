//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid432780.ts] ////

//// [input.ts]
const a: Foo<string> = new 
 Foo 
 ();

//// [input.ts]
const a = new 
 Foo<string> 
 ();
