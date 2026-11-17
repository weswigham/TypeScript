//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid7.ts] ////

//// [input.tsx]

declare const test: number | (boolean | (string & { __brand: true }));
const a = [...test];
      

//// [input.tsx]

declare const test: number | (boolean | (string & { __brand: true }));
const a = [...test];
      
