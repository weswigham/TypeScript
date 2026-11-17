//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid22.ts] ////

//// [input.ts]

namespace Test.Inner {
  export enum Bar {
    A = 1,
  }
}
namespace Test.Inner {
  export enum Bar {
    B = 'B',
  }
}
      

//// [input.ts]

namespace Test.Inner {
  export enum Bar {
    A = 1,
  }
}
namespace Test.Inner {
  export enum Bar {
    B = 'B',
  }
}
      
