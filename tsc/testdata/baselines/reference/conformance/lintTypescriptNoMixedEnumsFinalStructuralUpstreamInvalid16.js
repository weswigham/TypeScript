//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid16.ts] ////

//// [input.ts]

enum Foo {
  A,
}
enum Foo {
  B,
}
enum Foo {
  C = 'c',
}
      

//// [input.ts]

enum Foo {
  A,
}
enum Foo {
  B,
}
enum Foo {
  C = 'c',
}
      
