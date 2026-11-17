//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid23.ts] ////

//// [input.ts]

type A = 'A';
type B = 'B';
type C = 'C';
type T = A | B | A | C;
      

//// [input.ts]

type A = 'A';
type B = 'B';
type C = 'C';
type T = A | B   | C;
      
