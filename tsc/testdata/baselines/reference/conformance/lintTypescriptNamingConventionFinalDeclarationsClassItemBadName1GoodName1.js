//// [tests/cases/conformance/lint/rules/naming-convention/lintTypescriptNamingConventionFinalDeclarationsClassItemBadName1GoodName1.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
class Item { #bad_name = 1; goodName = 1; }

//// [input.ts]
class Item { #bad_name = 1; goodName = 1; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
