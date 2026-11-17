//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid16.ts] ////

//// [input.ts]

type A = 'A';
type T = A | A;
      

//// [input.ts]

type A = 'A';
type T = A  ;
      
