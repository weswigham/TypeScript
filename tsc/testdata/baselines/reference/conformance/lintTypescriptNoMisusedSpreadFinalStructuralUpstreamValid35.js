//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamValid35.ts] ////

//// [input.tsx]

type CustomIterable = {
  [Symbol.iterator]: () => Generator<string>;
};

declare const iterator: CustomIterable;

const a = { ...iterator };
      

//// [input.tsx]

type CustomIterable = {
  [Symbol.iterator]: () => Generator<string>;
};

declare const iterator: CustomIterable;

const a = { ...iterator };
      
