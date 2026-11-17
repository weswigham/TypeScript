//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamValid34.ts] ////

//// [input.ts]

namespace Test {
  export enum Bar {
    A = 1,
  }
}
function foo() {
  enum Bar {
    B = 'B',
  }
  return Bar;
}
    

//// [input.ts]

namespace Test {
  export enum Bar {
    A = 1,
  }
}
function foo() {
  enum Bar {
    B = 'B',
  }
  return Bar;
}
    
