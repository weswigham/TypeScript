//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid42.ts] ////

//// [input.tsx]

declare const map: Map<string, number> | { a: number };
const o = { ...map };
      

//// [input.tsx]

declare const map: Map<string, number> | { a: number };
const o = { ...map };
      
