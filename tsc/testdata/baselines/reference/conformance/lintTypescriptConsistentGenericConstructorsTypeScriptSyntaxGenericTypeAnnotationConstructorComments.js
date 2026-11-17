//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericTypeAnnotationConstructorComments.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
const a = new Foo/* before */ </* inside */ string> /* after */();

//// [input.ts]
const a: Foo</* inside */ string> = new Foo/* before */  /* after */();
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
