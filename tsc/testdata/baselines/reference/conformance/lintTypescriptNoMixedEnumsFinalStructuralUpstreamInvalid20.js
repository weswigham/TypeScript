//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid20.ts] ////

//// [input.ts]

namespace Test {
  export enum Bar {
    A,
  }
}
namespace Test {
  export enum Bar {
    B = 'B',
  }
}
      

//// [input.ts]

namespace Test {
  export enum Bar {
    A,
  }
}
namespace Test {
  export enum Bar {
    B = 'B',
  }
}
      
