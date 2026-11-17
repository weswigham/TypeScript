//// [tests/cases/conformance/lint/rules/no-empty-object-type/lintTypescriptNoEmptyObjectTypeTypeScriptSyntaxUpstreamInvalid156440.ts] ////

//// [input.ts]

interface Base {
  props: string;
}

interface Derived extends Base {}

const derived = class Derived {};
      

//// [input.ts]

interface Base {
  props: string;
}

interface Derived extends Base {}

const derived = class Derived {};
      
