//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid0.ts] ////

//// [input.ts]

export enum Fruit {
  Apple = 0,
}
export enum Fruit {
  Banana = 'banana',
}
      

//// [input.ts]

export enum Fruit {
  Apple = 0,
}
export enum Fruit {
  Banana = 'banana',
}
      
