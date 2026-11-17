//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid27.ts] ////

//// [input.ts]

type A = 'A';
type B = 'B';
type C = (A | B) | A | B | (A | B);
      

//// [input.ts]

type A = 'A';
type B = 'B';
type C = (A | B)      ;
      
