//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamInvalid5.ts] ////

//// [input.ts]

const getValue = () => 0;
enum Fruit {
  Apple = getValue(),
  Banana = 'banana',
}
      

//// [input.ts]

const getValue = () => 0;
enum Fruit {
  Apple = getValue(),
  Banana = 'banana',
}
      
