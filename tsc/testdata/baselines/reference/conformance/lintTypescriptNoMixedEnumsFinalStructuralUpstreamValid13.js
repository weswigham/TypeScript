//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamValid13.ts] ////

//// [input.ts]

enum First {
  A = 1,
}

enum Second {
  A = First.A,
  B = 2,
}
    

//// [input.ts]

enum First {
  A = 1,
}

enum Second {
  A = First.A,
  B = 2,
}
    
