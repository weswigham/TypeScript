//// [tests/cases/conformance/lint/rules/no-empty-object-type/lintTypescriptNoEmptyObjectTypeTypeScriptSyntaxUpstreamInvalid156480.ts] ////

//// [input.ts]

interface Base {
  props: string;
}

interface Derived extends Base {}

interface Derived {
  name: string;
}
      

//// [input.ts]

interface Base {
  props: string;
}

interface Derived extends Base {}

interface Derived {
  name: string;
}
      
