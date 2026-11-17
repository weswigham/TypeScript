//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid12.ts] ////

//// [input.ts]

enum Foo {
  A = 'a',
}
enum Foo {
  B,
}
      

//// [input.ts]

enum Foo {
  A = 'a',
}
enum Foo {
  B,
}
      
