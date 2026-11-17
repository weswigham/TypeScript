//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxUpstreamInvalid1171210.ts] ////

//// [input.ts]

type Foo = {
  a: string;
}
type Bar = string;
      

//// [input.ts]

interface Foo {
  a: string;
}
type Bar = string;
      
