//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid7.ts] ////

//// [input.ts]

const getValue = () => '';
enum Fruit {
  Apple = getValue(),
  Banana = 0,
}
      

//// [input.ts]

const getValue = () => '';
enum Fruit {
  Apple = getValue(),
  Banana = 0,
}
      
