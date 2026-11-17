//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamValid286380.ts] ////

//// [input.ts]

class Foo {
  accessor a: Foo<string> = new Foo();
}
      

//// [input.ts]

class Foo {
  accessor a: Foo<string> = new Foo();
}
      
