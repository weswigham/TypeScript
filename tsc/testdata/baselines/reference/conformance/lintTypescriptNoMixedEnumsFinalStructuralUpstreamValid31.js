//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamValid31.ts] ////

//// [input.ts]

namespace Test {
  export enum Bar {}
}
namespace Test {
  export enum Bar {
    B = 'B',
  }
}
    

//// [input.ts]

namespace Test {
  export enum Bar {}
}
namespace Test {
  export enum Bar {
    B = 'B',
  }
}
    
