//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamValid8.ts] ////

//// [input.ts]

const getValue = () => 0;
enum Fruit {
  Apple,
  Banana = getValue(),
}
    

//// [input.ts]

const getValue = () => 0;
enum Fruit {
  Apple,
  Banana = getValue(),
}
    
