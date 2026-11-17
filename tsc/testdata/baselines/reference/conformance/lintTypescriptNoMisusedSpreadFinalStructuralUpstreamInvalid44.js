//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid44.ts] ////

//// [input.tsx]

declare const a: Map<boolean, string> & Set<number>;
const o = { ...a };
      

//// [input.tsx]

declare const a: Map<boolean, string> & Set<number>;
const o = { ...a };
      
