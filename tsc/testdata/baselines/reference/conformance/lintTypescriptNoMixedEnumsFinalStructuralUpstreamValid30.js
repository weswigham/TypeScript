//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamValid30.ts] ////

//// [input.ts]

namespace Test {
  enum Bar {
    A = 1,
  }
}
namespace Test {
  enum Bar {
    B = 'B',
  }
}
    

//// [input.ts]

namespace Test {
  enum Bar {
    A = 1,
  }
}
namespace Test {
  enum Bar {
    B = 'B',
  }
}
    
