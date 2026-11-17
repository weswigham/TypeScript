//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid39.ts] ////

//// [input.tsx]

declare const map: Map<object, string> | WeakMap<object, string>;
const o = { other: 1, ...map };
      

//// [input.tsx]

declare const map: Map<object, string> | WeakMap<object, string>;
const o = { other: 1, ...map };
      
