//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamValid10.ts] ////

//// [input.ts]

const getValue = () => '';
enum Fruit {
  Apple = '',
  Banana = getValue(),
}
    

//// [input.ts]

const getValue = () => '';
enum Fruit {
  Apple = '',
  Banana = getValue(),
}
    
