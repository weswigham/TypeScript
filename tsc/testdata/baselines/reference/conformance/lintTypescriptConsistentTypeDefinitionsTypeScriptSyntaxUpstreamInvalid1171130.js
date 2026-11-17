//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxUpstreamInvalid1171130.ts] ////

//// [input.ts]

declare global {
  interface Array<T> {
    foo(x: (x: number) => T): T[];
  }
}
      

//// [input.ts]

declare global {
  interface Array<T> {
    foo(x: (x: number) => T): T[];
  }
}
      
