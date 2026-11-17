//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid74.ts] ////

//// [input.tsx]

class A {
  a = 1;
}

declare const a: A;

const o = { ...a };
      

//// [input.tsx]

class A {
  a = 1;
}

declare const a: A;

const o = { ...a };
      
