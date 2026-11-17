//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid84.ts] ////

//// [input.tsx]

const a = {
  ...class A {
    static value = 1;
    nonStatic = 2;
  },
};
      

//// [input.tsx]

const a = {
  ...class A {
    static value = 1;
    nonStatic = 2;
  },
};
      
