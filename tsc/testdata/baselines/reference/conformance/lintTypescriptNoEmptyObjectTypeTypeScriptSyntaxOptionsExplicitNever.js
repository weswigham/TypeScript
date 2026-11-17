//// [tests/cases/conformance/lint/rules/no-empty-object-type/lintTypescriptNoEmptyObjectTypeTypeScriptSyntaxOptionsExplicitNever.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface I {} interface J extends Base {} type T = {};

//// [input.ts]
interface I {} interface J extends Base {} type T = {};
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
