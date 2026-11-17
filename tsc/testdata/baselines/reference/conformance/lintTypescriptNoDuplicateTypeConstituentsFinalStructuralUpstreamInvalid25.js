//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid25.ts] ////

//// [input.ts]

type A = 'A';
type T = A | (A | A);
      

//// [input.ts]

type A = 'A';
type T = A  ;
      
