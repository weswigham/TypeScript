//// [tests/cases/conformance/lint/rules/no-redundant-type-constituents/lintTypescriptNoRedundantTypeConstituentsFinalStructuralUpstreamValid2.ts] ////

//// [input.ts]

type T = 1 | 2;
type U = T | 3;
type V = U;
    

//// [input.ts]

type T = 1 | 2;
type U = T | 3;
type V = U;
    
