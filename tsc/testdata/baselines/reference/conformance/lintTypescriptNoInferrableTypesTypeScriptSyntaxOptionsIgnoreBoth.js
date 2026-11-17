//// [tests/cases/conformance/lint/rules/no-inferrable-types/lintTypescriptNoInferrableTypesTypeScriptSyntaxOptionsIgnoreBoth.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
let a: number = 1; function f(b: number = 1) {} class C { c: number = 1; }

//// [input.ts]
let a = 1; function f(b: number = 1) {} class C { c: number = 1; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
