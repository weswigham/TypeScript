//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamValid9.ts] ////

//// [input.ts]

const getValue = () => 0;
enum Fruit {
  Apple = getValue(),
  Banana = getValue(),
}
    

//// [input.ts]

const getValue = () => 0;
enum Fruit {
  Apple = getValue(),
  Banana = getValue(),
}
    
