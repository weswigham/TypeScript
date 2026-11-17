//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericTypeAnnotationMethodParameter.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
class C { constructor(a = new Foo<string>()) {} method(a = new Foo<string>()) {} }

//// [input.ts]
class C { constructor(a: Foo<string> = new Foo()) {} method(a: Foo<string> = new Foo()) {} }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
