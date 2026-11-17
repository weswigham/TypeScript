//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid21.ts] ////

//// [input.ts]

namespace Outer {
  export namespace Test {
    export enum Bar {
      A = 1,
    }
  }
}
namespace Outer {
  export namespace Test {
    export enum Bar {
      B = 'B',
    }
  }
}
      

//// [input.ts]

namespace Outer {
  export namespace Test {
    export enum Bar {
      A = 1,
    }
  }
}
namespace Outer {
  export namespace Test {
    export enum Bar {
      B = 'B',
    }
  }
}
      
