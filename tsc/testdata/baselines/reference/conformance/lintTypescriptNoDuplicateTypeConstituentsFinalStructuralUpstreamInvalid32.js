//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid32.ts] ////

//// [input.ts]

type A = 'A';
type T = Record<string, A | A>;
      

//// [input.ts]

type A = 'A';
type T = Record<string, A  >;
      
