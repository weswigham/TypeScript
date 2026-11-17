//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericTypeAnnotationProperties.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
class C { [key + 1] = new Foo<string>(); accessor a = new Foo<number>(); }

//// [input.ts]
class C { [key + 1]: Foo<string> = new Foo(); accessor a: Foo<number> = new Foo(); }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
