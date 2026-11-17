//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid25.ts] ////

//// [input.ts]

declare module 'other-module' {
  export enum Bar {
    A = 1,
  }
}
declare module 'other-module' {
  export enum Bar {
    B = 'B',
  }
}
      

//// [input.ts]

declare module 'other-module' {
  export enum Bar {
    A = 1,
  }
}
declare module 'other-module' {
  export enum Bar {
    B = 'B',
  }
}
      
