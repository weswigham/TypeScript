//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid8.ts] ////

//// [input.ts]

enum First {
  A = 1,
}

enum Second {
  A = First.A,
  B = 'b',
}
      

//// [input.ts]

enum First {
  A = 1,
}

enum Second {
  A = First.A,
  B = 'b',
}
      
