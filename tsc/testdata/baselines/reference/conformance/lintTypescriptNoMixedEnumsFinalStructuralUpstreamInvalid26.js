//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid26.ts] ////

//// [input.ts]

export {};
declare global {
  export enum Bar {
    A = 1,
  }
}
declare global {
  export enum Bar {
    B = 'B',
  }
}
      

//// [input.ts]

export {};
declare global {
  export enum Bar {
    A = 1,
  }
}
declare global {
  export enum Bar {
    B = 'B',
  }
}
      
