//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid24.ts] ////

//// [input.ts]

namespace Test {
  export enum Bar {
    A = 1,
  }
}
namespace Other {
  export enum Bar {
    B = 2,
  }
}
namespace Test {
  export enum Bar {
    C = 'C',
  }
}
      

//// [input.ts]

namespace Test {
  export enum Bar {
    A = 1,
  }
}
namespace Other {
  export enum Bar {
    B = 2,
  }
}
namespace Test {
  export enum Bar {
    C = 'C',
  }
}
      
