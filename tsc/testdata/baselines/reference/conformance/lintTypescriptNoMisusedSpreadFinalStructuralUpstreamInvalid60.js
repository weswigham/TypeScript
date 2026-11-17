//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid60.ts] ////

//// [input.tsx]

declare const f: () => void | { a: number };

const o = { ...f };
      

//// [input.tsx]

declare const f: () => void | { a: number };

const o = { ...f };
      
