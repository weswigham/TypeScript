//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid21.ts] ////

//// [input.tsx]

declare function getArray(): number[];
const o = { ...getArray() };
      

//// [input.tsx]

declare function getArray(): number[];
const o = { ...getArray() };
      
