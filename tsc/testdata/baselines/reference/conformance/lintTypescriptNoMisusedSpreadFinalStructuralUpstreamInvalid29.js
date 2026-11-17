//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid29.ts] ////

//// [input.tsx]

declare function getSet(): Set<number>;
const o = { ...getSet() };
      

//// [input.tsx]

declare function getSet(): Set<number>;
const o = { ...getSet() };
      
