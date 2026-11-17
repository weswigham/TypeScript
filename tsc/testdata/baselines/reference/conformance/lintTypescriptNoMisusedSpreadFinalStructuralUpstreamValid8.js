//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamValid8.ts] ////

//// [input.tsx]

const iterator = {
  *[Symbol.iterator]() {
    yield 1;
    yield 2;
    yield 3;
  },
};

const a = [...iterator];
    

//// [input.tsx]

const iterator = {
  *[Symbol.iterator]() {
    yield 1;
    yield 2;
    yield 3;
  },
};

const a = [...iterator];
    
