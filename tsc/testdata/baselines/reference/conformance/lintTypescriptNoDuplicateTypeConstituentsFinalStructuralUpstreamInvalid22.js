//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid22.ts] ////

//// [input.ts]

type A = 'A';
type B = 'B';
type T = A | B | A | A;
      

//// [input.ts]

type A = 'A';
type B = 'B';
type T = A | B    ;
      
