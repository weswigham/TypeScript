//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericTypeAnnotationNotIdentifier.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
const a = new NS.Foo<string>();

//// [input.ts]
const a = new NS.Foo<string>();
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
