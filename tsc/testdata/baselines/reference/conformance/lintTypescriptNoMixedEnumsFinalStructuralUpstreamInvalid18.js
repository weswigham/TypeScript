//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid18.ts] ////

//// [input.ts]

enum Foo {
  A = 1,
}
enum Foo {
  B = 'B',
}
      

//// [input.ts]

enum Foo {
  A = 1,
}
enum Foo {
  B = 'B',
}
      
