//// [tests/cases/conformance/lint/rules/no-empty-object-type/lintTypescriptNoEmptyObjectTypeTypeScriptSyntaxOptionsSingleExtends.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface I {} interface J extends Base {} interface K extends A, B {}

//// [input.ts]
interface I {} interface J extends Base {} interface K extends A, B {}
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
