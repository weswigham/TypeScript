//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamValid24.ts] ////

//// [input.ts]

enum Foo {
  A = 'A',
}
enum Foo {
  B = false, // (TS error)
}
    

//// [input.ts]

enum Foo {
  A = 'A',
}
enum Foo {
  B = false, // (TS error)
}
    
