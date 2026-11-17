//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid12.ts] ////

//// [input.tsx]

declare function getString<T extends string>(): T;
const a = [...getString()];
      

//// [input.tsx]

declare function getString<T extends string>(): T;
const a = [...getString()];
      
