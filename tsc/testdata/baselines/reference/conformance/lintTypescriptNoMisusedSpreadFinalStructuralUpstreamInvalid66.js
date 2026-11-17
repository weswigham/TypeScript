//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid66.ts] ////

//// [input.tsx]

declare const iterator: Iterable<string> | { a: number };

const o = { ...iterator };
      

//// [input.tsx]

declare const iterator: Iterable<string> | { a: number };

const o = { ...iterator };
      
