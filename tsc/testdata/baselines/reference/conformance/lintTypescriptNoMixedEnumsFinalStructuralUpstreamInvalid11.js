//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid11.ts] ////

//// [input.ts]

enum Foo {
  A = 1,
}
enum Foo {
  B = 'b',
}
      

//// [input.ts]

enum Foo {
  A = 1,
}
enum Foo {
  B = 'b',
}
      
