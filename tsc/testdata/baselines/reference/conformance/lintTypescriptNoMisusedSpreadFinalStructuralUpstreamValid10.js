//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamValid10.ts] ////

//// [input.tsx]

declare const data: Iterable<number> & number[];

const a = [...data];
    

//// [input.tsx]

declare const data: Iterable<number> & number[];

const a = [...data];
    
