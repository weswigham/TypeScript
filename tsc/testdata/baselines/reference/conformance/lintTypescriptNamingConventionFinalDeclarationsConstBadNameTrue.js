//// [tests/cases/conformance/lint/rules/naming-convention/lintTypescriptNamingConventionFinalDeclarationsConstBadNameTrue.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
const badName = true;

//// [input.ts]
const badName = true;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
