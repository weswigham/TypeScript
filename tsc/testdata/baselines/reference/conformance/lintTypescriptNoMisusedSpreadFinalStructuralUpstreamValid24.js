//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamValid24.ts] ////

//// [input.tsx]

function* generator() {}

generator.prop = 1;

const o = { ...generator };
    

//// [input.tsx]

function* generator() {}

generator.prop = 1;

const o = { ...generator };
    
