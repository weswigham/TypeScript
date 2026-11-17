//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxUpstreamInvalid1171220.ts] ////

//// [input.ts]

type Foo = ((({
  a: string;
})))

const bar = 1;
      

//// [input.ts]

interface Foo {
  a: string;
}

const bar = 1;
      
