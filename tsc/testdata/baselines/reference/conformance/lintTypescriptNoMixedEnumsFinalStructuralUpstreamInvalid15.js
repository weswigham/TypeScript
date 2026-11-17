//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid15.ts] ////

//// [input.ts]

enum Foo {
  A,
}
enum Foo {
  B = 'b',
}
enum Foo {
  C,
}
      

//// [input.ts]

enum Foo {
  A,
}
enum Foo {
  B = 'b',
}
enum Foo {
  C,
}
      
