//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamValid23.ts] ////

//// [input.ts]

enum Foo {
  A = false, // (TS error)
}
enum Foo {
  B = `B`,
}
    

//// [input.ts]

enum Foo {
  A = false, // (TS error)
}
enum Foo {
  B = `B`,
}
    
