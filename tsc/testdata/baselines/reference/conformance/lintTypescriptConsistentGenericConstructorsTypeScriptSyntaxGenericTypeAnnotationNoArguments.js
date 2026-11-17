//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericTypeAnnotationNoArguments.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
const a = new Foo();

//// [input.ts]
const a = new Foo();
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
