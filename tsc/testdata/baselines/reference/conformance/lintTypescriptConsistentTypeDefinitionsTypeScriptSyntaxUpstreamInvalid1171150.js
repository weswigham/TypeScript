//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxUpstreamInvalid1171150.ts] ////

//// [input.ts]

export default interface Test {
  bar(): string;
  foo(): number;
}
      

//// [input.ts]

type Test = {
  bar(): string;
  foo(): number;
}
export default Test
      
