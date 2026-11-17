//// [tests/cases/conformance/lint/rules/no-inferrable-types/lintTypescriptNoInferrableTypesTypeScriptSyntaxOptionsIgnoreParameters.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
function f(a: number = 1) {} const f2 = (b: string = '') => b; class C { constructor(public c: boolean = true) {} method(d: number = 2) {} }

//// [input.ts]
function f(a: number = 1) {} const f2 = (b: string = '') => b; class C { constructor(public c: boolean = true) {} method(d: number = 2) {} }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
