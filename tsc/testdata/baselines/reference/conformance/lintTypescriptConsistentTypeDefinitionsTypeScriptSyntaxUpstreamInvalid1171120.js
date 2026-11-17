//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxUpstreamInvalid1171120.ts] ////

//// [input.ts]

global {
  interface Array<T> {
    foo(x: (x: number) => T): T[];
  }
}
      

//// [input.ts]

global {
  type Array<T> = {
    foo(x: (x: number) => T): T[];
  }
}
      
