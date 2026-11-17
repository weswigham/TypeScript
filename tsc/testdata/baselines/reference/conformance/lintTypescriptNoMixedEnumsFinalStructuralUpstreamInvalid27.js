//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid27.ts] ////

//// [input.ts]

enum Bar {
  A = 1,
}
namespace Bar {
  export const baz = 'baz';
}
enum Bar {
  B = 'B',
}
      

//// [input.ts]

enum Bar {
  A = 1,
}
namespace Bar {
  export const baz = 'baz';
}
enum Bar {
  B = 'B',
}
      
