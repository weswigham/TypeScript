//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamValid11.ts] ////

//// [input.tsx]

declare function getIterable(): Iterable<number>;

const a = [...getIterable()];
    

//// [input.tsx]

declare function getIterable(): Iterable<number>;

const a = [...getIterable()];
    
