//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid34.ts] ////

//// [input.tsx]

declare const map: Map<string, number>;
const o = { ...(map, map) };
      

//// [input.tsx]

declare const map: Map<string, number>;
const o = { ...(map, map) };
      
