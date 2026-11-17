//// [tests/cases/conformance/lint/rules/naming-convention/lintTypescriptNamingConventionFinalDeclarationsConstObjectBadName1.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
const object = { 'bad-name': 1 };

//// [input.ts]
const object = { 'bad-name': 1 };
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
