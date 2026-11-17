//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid14.ts] ////

//// [input.ts]

enum Foo {
  A,
}
enum Foo {
  B = 'b',
}
enum Foo {
  C = 'c',
}
      

//// [input.ts]

enum Foo {
  A,
}
enum Foo {
  B = 'b',
}
enum Foo {
  C = 'c',
}
      
