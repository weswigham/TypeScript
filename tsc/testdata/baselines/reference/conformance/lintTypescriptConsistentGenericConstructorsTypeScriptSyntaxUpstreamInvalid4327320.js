//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid4327320.ts] ////

//// [input.ts]

class A {
  constructor(a = new Foo<string>()) {}
}
      

//// [input.ts]

class A {
  constructor(a: Foo<string> = new Foo()) {}
}
      
