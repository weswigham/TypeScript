//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid52.ts] ////

//// [input.tsx]

declare function getPromise(): Promise<number>;
const o = { ...getPromise() };
      

//// [input.tsx]

declare function getPromise(): Promise<number>;
const o = { ...getPromise() };
      
