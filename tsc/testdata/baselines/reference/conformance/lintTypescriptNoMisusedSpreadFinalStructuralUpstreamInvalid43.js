//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid43.ts] ////

//// [input.tsx]

declare function getMap(): Map<string, number>;
const o = { ...getMap() };
      

//// [input.tsx]

declare function getMap(): Map<string, number>;
const o = { ...getMap() };
      
