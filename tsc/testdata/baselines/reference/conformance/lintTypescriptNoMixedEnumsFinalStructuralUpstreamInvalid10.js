//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid10.ts] ////

//// [input.ts]

enum Foo {
  A,
}
enum Foo {
  B = 'b',
}
      

//// [input.ts]

enum Foo {
  A,
}
enum Foo {
  B = 'b',
}
      
