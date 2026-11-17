//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid4327270.ts] ////

//// [input.ts]

class Foo {
  [a] = new Foo<string>();
}
      

//// [input.ts]

class Foo {
  [a]: Foo<string> = new Foo();
}
      
