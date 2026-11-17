//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid77.ts] ////

//// [input.tsx]

class A {
  a = 1;
}

class B extends A {}

const o = { ...new B() };
      

//// [input.tsx]

class A {
  a = 1;
}

class B extends A {}

const o = { ...new B() };
      
