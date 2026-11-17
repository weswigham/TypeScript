//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxUpstreamInvalid1171110.ts] ////

//// [input.ts]

namespace JSX {
  interface Array<T> {
    foo(x: (x: number) => T): T[];
  }
}
      

//// [input.ts]

namespace JSX {
  type Array<T> = {
    foo(x: (x: number) => T): T[];
  }
}
      
