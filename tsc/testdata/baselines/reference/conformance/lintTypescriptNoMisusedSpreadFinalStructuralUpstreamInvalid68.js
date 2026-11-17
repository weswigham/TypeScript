//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid68.ts] ////

//// [input.tsx]

class A {
  [Symbol.iterator]() {
    return {
      next() {
        return { done: true, value: undefined };
      },
    };
  }
}

const a = { ...new A() };
      

//// [input.tsx]

class A {
  [Symbol.iterator]() {
    return {
      next() {
        return { done: true, value: undefined };
      },
    };
  }
}

const a = { ...new A() };
      
