//// [tests/cases/conformance/lint/rules/no-inferrable-types/lintTypescriptNoInferrableTypesTypeScriptSyntaxOptionsIgnoreProperties.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
class C { x: number = 1; accessor y: string = ''; static z: boolean = true; constructor(public p: number = 1) {} }

//// [input.ts]
class C { x: number = 1; accessor y: string = ''; static z: boolean = true; constructor(public p = 1) {} }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
