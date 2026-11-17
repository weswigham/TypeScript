//// [tests/cases/conformance/lint/rules/no-empty-object-type/lintTypescriptNoEmptyObjectTypeTypeScriptSyntaxUpstreamValid25410.ts] ////

//// [input.ts]

interface Base {
  name: string;
}

interface Derived {
  age: number;
}

// valid because extending multiple interfaces can be used instead of a union type
interface Both extends Base, Derived {}
    

//// [input.ts]

interface Base {
  name: string;
}

interface Derived {
  age: number;
}

// valid because extending multiple interfaces can be used instead of a union type
interface Both extends Base, Derived {}
    
