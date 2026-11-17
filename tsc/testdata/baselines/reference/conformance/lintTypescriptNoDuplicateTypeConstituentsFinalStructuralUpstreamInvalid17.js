//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/lintTypescriptNoDuplicateTypeConstituentsFinalStructuralUpstreamInvalid17.ts] ////

//// [input.ts]

type A = 'A';
const a: A | A = 'A';
      

//// [input.ts]

type A = 'A';
const a: A   = 'A';
      
