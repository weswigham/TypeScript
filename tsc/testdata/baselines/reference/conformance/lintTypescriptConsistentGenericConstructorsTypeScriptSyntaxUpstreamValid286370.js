//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamValid286370.ts] ////

//// [input.ts]

class Foo {
  a: Foo<string> = new Foo();
}
      

//// [input.ts]

class Foo {
  a: Foo<string> = new Foo();
}
      
