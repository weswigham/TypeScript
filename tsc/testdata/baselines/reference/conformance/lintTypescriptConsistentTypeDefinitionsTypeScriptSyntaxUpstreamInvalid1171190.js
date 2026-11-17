//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxUpstreamInvalid1171190.ts] ////

//// [input.ts]

type Foo = ((((((((({
  a: string;
})))))))));
      

//// [input.ts]

interface Foo {
  a: string;
}
      
