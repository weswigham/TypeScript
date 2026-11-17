//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericTypeAnnotationExcludedParameters.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
const f = (a = new Foo<string>()) => a; class C { constructor(public a = new Foo<string>()) {} }

//// [input.ts]
const f = (a = new Foo<string>()) => a; class C { constructor(public a = new Foo<string>()) {} }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
