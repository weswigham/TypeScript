//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid67.ts] ////

//// [input.tsx]

declare function getIterable(): Iterable<string>;

const o = { ...getIterable() };
      

//// [input.tsx]

declare function getIterable(): Iterable<string>;

const o = { ...getIterable() };
      
