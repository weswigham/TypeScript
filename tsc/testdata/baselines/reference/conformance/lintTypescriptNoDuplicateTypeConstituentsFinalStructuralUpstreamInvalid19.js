//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid19.ts] ////

//// [input.ts]

type A1 = 'A';
type A2 = 'A';
type A3 = 'A';
type T = A1 | A2 | A3;
      

//// [input.ts]

type A1 = 'A';
type A2 = 'A';
type A3 = 'A';
type T = A1    ;
      
