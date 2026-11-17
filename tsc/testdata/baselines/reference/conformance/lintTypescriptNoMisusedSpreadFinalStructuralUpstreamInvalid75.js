//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid75.ts] ////

//// [input.tsx]

class A {
  a = 1;
}

declare function getA(): A;

const o = { ...getA() };
      

//// [input.tsx]

class A {
  a = 1;
}

declare function getA(): A;

const o = { ...getA() };
      
