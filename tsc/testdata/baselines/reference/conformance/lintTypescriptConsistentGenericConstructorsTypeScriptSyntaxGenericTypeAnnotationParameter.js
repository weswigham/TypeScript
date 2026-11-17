//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericTypeAnnotationParameter.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
function f({ a } = new Foo<string>()) {}

//// [input.ts]
function f({ a }: Foo<string> = new Foo()) {}
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
