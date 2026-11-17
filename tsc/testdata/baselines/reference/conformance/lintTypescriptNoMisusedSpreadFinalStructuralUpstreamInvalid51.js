//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid51.ts] ////

//// [input.tsx]

declare const promise: Promise<number> & { a: number };
const o = { ...promise };
      

//// [input.tsx]

declare const promise: Promise<number> & { a: number };
const o = { ...promise };
      
