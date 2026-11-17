//// [tests/cases/conformance/lint/rules/naming-convention/lintTypescriptNamingConventionFinalDeclarationsFunctionGoodNameBadParameterString.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
function goodName(BadParameter: string) {}

//// [input.ts]
function goodName(BadParameter: string) {}
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
