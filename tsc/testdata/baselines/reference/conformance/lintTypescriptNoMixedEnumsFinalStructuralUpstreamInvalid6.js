//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid6.ts] ////

//// [input.ts]

const getValue = () => '';
enum Fruit {
  Apple,
  Banana = getValue(),
}
      

//// [input.ts]

const getValue = () => '';
enum Fruit {
  Apple,
  Banana = getValue(),
}
      
