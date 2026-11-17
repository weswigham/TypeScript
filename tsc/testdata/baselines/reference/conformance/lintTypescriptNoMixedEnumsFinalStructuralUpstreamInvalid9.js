//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid9.ts] ////

//// [input.ts]

enum First {
  A = 'a',
}

enum Second {
  A = First.A,
  B = 1,
}
      

//// [input.ts]

enum First {
  A = 'a',
}

enum Second {
  A = First.A,
  B = 1,
}
      
