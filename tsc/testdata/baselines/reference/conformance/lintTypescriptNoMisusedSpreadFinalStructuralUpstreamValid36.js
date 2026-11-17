//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamValid36.ts] ////

//// [input.tsx]

type CustomIterable = {
  [Symbol.iterator]: () => string;
};

declare const iterator: CustomIterable;

const a = { ...iterator };
      

//// [input.tsx]

type CustomIterable = {
  [Symbol.iterator]: () => string;
};

declare const iterator: CustomIterable;

const a = { ...iterator };
      
