//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid22.ts] ////

//// [input.tsx]

declare function getArray(): readonly number[];
const o = { ...getArray() };
      

//// [input.tsx]

declare function getArray(): readonly number[];
const o = { ...getArray() };
      
