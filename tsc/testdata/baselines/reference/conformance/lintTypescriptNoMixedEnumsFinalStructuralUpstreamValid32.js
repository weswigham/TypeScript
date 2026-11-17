//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamValid32.ts] ////

//// [input.ts]

namespace Test.Inner {
  export enum Bar {
    A = 1,
  }
}
namespace Test.Other {
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
namespace Test.Other {
  export enum Bar {
    B = 'B',
  }
}
    
