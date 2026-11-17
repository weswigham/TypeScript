//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid4327340.ts] ////

//// [input.ts]

class Float32Array<T> {}
const a: Float32Array<ArrayBufferLike> = new Float32Array();
export {};
      

//// [input.ts]

class Float32Array<T> {}
const a = new Float32Array<ArrayBufferLike>();
export {};
      
