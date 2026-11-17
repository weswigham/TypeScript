//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid4327120.ts] ////

//// [input.ts]

class Foo {
  accessor a = new Foo<string>();
}
      

//// [input.ts]

class Foo {
  accessor a: Foo<string> = new Foo();
}
      
