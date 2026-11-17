//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid4327280.ts] ////

//// [input.ts]

class Foo {
  [a + b] = new Foo<string>();
}
      

//// [input.ts]

class Foo {
  [a + b]: Foo<string> = new Foo();
}
      
