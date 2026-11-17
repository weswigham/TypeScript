//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid53.ts] ////

//// [input.tsx]

declare function getPromise<T extends Promise<number>>(arg: T): T;
const o = { ...getPromise() };
      

//// [input.tsx]

declare function getPromise<T extends Promise<number>>(arg: T): T;
const o = { ...getPromise() };
      
