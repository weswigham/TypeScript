//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid6.ts] ////

//// [input.tsx]

declare const test: string & { __brand: 'test' };
const a = [...test];
      

//// [input.tsx]

declare const test: string & { __brand: 'test' };
const a = [...test];
      
