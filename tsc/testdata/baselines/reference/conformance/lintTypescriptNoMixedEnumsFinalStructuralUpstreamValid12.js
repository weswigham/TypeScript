//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamValid12.ts] ////

//// [input.ts]

const getValue = () => '';
enum Fruit {
  Apple = getValue(),
  Banana = getValue(),
}
    

//// [input.ts]

const getValue = () => '';
enum Fruit {
  Apple = getValue(),
  Banana = getValue(),
}
    
