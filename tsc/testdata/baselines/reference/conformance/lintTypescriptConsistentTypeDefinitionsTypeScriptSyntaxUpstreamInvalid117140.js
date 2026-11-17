//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxUpstreamInvalid117140.ts] ////

//// [input.ts]

export type W<T> = {
  x: T;
};
      

//// [input.ts]

export interface W<T> {
  x: T;
}
      
