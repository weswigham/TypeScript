//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid76.ts] ////

//// [input.tsx]

class A {
  a = 1;
}

declare function getA<T extends A>(arg: T): T;

const o = { ...getA() };
      

//// [input.tsx]

class A {
  a = 1;
}

declare function getA<T extends A>(arg: T): T;

const o = { ...getA() };
      
