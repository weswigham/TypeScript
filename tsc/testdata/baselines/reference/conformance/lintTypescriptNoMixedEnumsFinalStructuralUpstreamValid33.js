//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamValid33.ts] ////

//// [input.ts]

declare module 'first' {
  export enum Bar {
    A = 1,
  }
}
declare module 'second' {
  export enum Bar {
    B = 'B',
  }
}
    

//// [input.ts]

declare module 'first' {
  export enum Bar {
    A = 1,
  }
}
declare module 'second' {
  export enum Bar {
    B = 'B',
  }
}
    
