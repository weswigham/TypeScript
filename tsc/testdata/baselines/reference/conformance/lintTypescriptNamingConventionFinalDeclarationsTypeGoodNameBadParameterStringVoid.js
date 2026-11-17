//// [tests/cases/conformance/lint/rules/naming-convention/lintTypescriptNamingConventionFinalDeclarationsTypeGoodNameBadParameterStringVoid.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
type GoodName = (BadParameter: string) => void;

//// [input.ts]
type GoodName = (BadParameter: string) => void;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
