//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid35.ts] ////

//// [input.tsx]

declare const map: Map<string, number>;
const others = { a: 1 };
const o = { ...map, ...others };
      

//// [input.tsx]

declare const map: Map<string, number>;
const others = { a: 1 };
const o = { ...map, ...others };
      
