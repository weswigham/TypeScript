//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamValid14.ts] ////

//// [input.ts]

enum First {
  A = '',
}

enum Second {
  A = First.A,
  B = 'b',
}
    

//// [input.ts]

enum First {
  A = '',
}

enum Second {
  A = First.A,
  B = 'b',
}
    
