//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericTypeAnnotationBuiltinArrays.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
const a = new Uint8Array<ArrayBuffer>();

//// [input.ts]
const a: Uint8Array<ArrayBuffer> = new Uint8Array();
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
