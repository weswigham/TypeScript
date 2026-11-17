//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid50.ts] ////

//// [input.tsx]

declare const maybePromise: Promise<number> | { a: number };
const o = { ...maybePromise };
      

//// [input.tsx]

declare const maybePromise: Promise<number> | { a: number };
const o = { ...maybePromise };
      
