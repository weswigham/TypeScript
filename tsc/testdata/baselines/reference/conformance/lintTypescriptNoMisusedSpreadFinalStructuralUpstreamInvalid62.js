//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid62.ts] ////

//// [input.tsx]

const iterator = {
  *[Symbol.iterator]() {
    yield 'test';
  },
};

const o = { ...iterator };
      

//// [input.tsx]

const iterator = {
  *[Symbol.iterator]() {
    yield 'test';
  },
};

const o = { ...iterator };
      
