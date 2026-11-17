//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralUpstreamValid11.ts] ////

//// [input.ts]

const getValue = () => '';
enum Fruit {
  Apple = getValue(),
  Banana = '',
}
    

//// [input.ts]

const getValue = () => '';
enum Fruit {
  Apple = getValue(),
  Banana = '',
}
    
