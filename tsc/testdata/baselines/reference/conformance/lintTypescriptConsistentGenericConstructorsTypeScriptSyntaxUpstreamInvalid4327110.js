//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid4327110.ts] ////

//// [input.ts]

class Foo {
  accessor a: Foo<string> = new Foo();
}
      

//// [input.ts]

class Foo {
  accessor a = new Foo<string>();
}
      
