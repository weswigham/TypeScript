//// [tests/cases/conformance/lint/rules/no-empty-object-type/lintTypescriptNoEmptyObjectTypeTypeScriptSyntaxOptionsAllowInterfacesOnly.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface I {} type T = {};

//// [input.ts]
interface I {} type T = {};
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
