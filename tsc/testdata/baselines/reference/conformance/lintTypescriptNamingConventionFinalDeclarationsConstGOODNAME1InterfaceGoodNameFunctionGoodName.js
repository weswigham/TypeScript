//// [tests/cases/conformance/lint/rules/naming-convention/lintTypescriptNamingConventionFinalDeclarationsConstGOODNAME1InterfaceGoodNameFunctionGoodName.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
const GOOD_NAME = 1; interface GoodName {} function goodName() {}

//// [input.ts]
const GOOD_NAME = 1; interface GoodName {} function goodName() {}
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
