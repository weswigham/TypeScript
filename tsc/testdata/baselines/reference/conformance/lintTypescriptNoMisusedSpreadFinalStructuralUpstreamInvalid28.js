//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid28.ts] ////

//// [input.tsx]

declare const set: Set<number> | { a: number };
const o = { ...set };
      

//// [input.tsx]

declare const set: Set<number> | { a: number };
const o = { ...set };
      
