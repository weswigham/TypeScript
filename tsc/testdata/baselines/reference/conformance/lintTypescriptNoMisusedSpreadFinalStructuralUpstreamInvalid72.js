//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid72.ts] ////

//// [input.tsx]

class A {
  a = 1;
  public b = 2;
  private c = 3;
  protected d = 4;
  static e = 5;
}

const o = { ...new A() };
      

//// [input.tsx]

class A {
  a = 1;
  public b = 2;
  private c = 3;
  protected d = 4;
  static e = 5;
}

const o = { ...new A() };
      
