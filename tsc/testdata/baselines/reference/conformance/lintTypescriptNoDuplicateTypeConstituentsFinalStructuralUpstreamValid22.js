//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamValid22.ts] ////

//// [input.ts]

type A = 'A';
type B = 'B';
type T = A | /* comment */ B;
      

//// [input.ts]

type A = 'A';
type B = 'B';
type T = A | /* comment */ B;
      
