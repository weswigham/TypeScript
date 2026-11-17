//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericShadowed.ts] ////

//// [input.ts]
class Uint8Array<T> {} const value: Uint8Array<string> = new Uint8Array();

//// [input.ts]
class Uint8Array<T> {} const value = new Uint8Array<string>();
