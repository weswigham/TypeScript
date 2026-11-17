//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxUpstreamInvalid1171170.ts] ////

//// [input.ts]

export declare interface Test {
  foo: string;
  bar: string;
}
      

//// [input.ts]

export declare type Test = {
  foo: string;
  bar: string;
}
      
