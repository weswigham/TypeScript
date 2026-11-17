//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamValid27.ts] ////

//// [input.ts]

type A = 'A';
type B = 'B';
type T = (A | B) | (A & B);
      

//// [input.ts]

type A = 'A';
type B = 'B';
type T = (A | B) | (A & B);
      
