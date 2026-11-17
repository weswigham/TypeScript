//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid18.ts] ////

//// [input.ts]

type A = 'A';
type T = A | /* comment */ A;
      

//// [input.ts]

type A = 'A';
type T = A  /* comment */ ;
      
