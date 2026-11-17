//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid78.ts] ////

//// [input.tsx]

class A {
  a = 1;
}

declare const a: A | { b: string };

const o = { ...a };
      

//// [input.tsx]

class A {
  a = 1;
}

declare const a: A | { b: string };

const o = { ...a };
      
