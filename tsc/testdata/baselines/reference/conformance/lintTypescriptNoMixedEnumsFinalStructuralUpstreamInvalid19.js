//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid19.ts] ////

//// [input.ts]

namespace Test {
  export enum Bar {
    A = 1,
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
    A = 1,
  }
}
namespace Test {
  export enum Bar {
    B = 'B',
  }
}
      
