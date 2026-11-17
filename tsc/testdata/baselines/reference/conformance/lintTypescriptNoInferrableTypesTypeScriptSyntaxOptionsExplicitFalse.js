//// [tests/cases/conformance/lint/rules/no-inferrable-types/lintTypescriptNoInferrableTypesTypeScriptSyntaxOptionsExplicitFalse.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
function f(a: number = 1) {} class C { b: number = 1; }

//// [input.ts]
function f(a = 1) {} class C { b = 1; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
