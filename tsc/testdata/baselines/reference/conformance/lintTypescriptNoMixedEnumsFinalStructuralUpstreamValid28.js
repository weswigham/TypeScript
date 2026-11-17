//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamValid28.ts] ////

//// [input.ts]

namespace Outer {
  namespace Test {
    export enum Bar {
      A = 1,
    }
  }
}
namespace Outer {
  namespace Test {
    export enum Bar {
      B = 'B',
    }
  }
}
    

//// [input.ts]

namespace Outer {
  namespace Test {
    export enum Bar {
      A = 1,
    }
  }
}
namespace Outer {
  namespace Test {
    export enum Bar {
      B = 'B',
    }
  }
}
    
