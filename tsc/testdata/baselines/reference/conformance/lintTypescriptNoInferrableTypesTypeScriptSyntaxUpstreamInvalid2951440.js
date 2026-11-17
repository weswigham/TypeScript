//// [tests/cases/conformance/lint/rules/no-inferrable-types/lintTypescriptNoInferrableTypesTypeScriptSyntaxUpstreamInvalid2951440.ts] ////

//// [input.ts]

class Foo {
  constructor(public a: boolean = true) {}
}
      

//// [input.ts]

class Foo {
  constructor(public a = true) {}
}
      
