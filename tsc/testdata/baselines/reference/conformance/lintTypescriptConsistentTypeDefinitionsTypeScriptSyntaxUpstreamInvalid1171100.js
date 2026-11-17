//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxUpstreamInvalid1171100.ts] ////

//// [input.ts]

export interface W<T> {
  x: T;
}
      

//// [input.ts]

export type W<T> = {
  x: T;
}
      
