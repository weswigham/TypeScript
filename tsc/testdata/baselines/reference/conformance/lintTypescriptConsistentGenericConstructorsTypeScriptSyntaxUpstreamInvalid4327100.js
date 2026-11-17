//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid4327100.ts] ////

//// [input.ts]

class Foo {
  [a]: Foo<string> = new Foo();
}
      

//// [input.ts]

class Foo {
  [a] = new Foo<string>();
}
      
