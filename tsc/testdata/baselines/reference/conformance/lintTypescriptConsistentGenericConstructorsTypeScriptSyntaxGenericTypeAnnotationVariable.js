//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericTypeAnnotationVariable.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
const a = new Foo<string>();

//// [input.ts]
const a: Foo<string> = new Foo();
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
