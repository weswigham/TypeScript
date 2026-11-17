//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid63.ts] ////

//// [input.tsx]

type CustomIterable = {
  [Symbol.iterator]: () => Generator<string>;
};

const iterator: CustomIterable = {
  *[Symbol.iterator]() {
    yield 'test';
  },
};

const a = { ...iterator };
      

//// [input.tsx]

type CustomIterable = {
  [Symbol.iterator]: () => Generator<string>;
};

const iterator: CustomIterable = {
  *[Symbol.iterator]() {
    yield 'test';
  },
};

const a = { ...iterator };
      
