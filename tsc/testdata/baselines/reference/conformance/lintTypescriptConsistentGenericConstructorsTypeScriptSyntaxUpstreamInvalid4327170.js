//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid4327170.ts] ////

//// [input.ts]

class A {
  constructor(a: Foo<string> = new Foo()) {}
}
      

//// [input.ts]

class A {
  constructor(a = new Foo<string>()) {}
}
      
