//// [tests/cases/conformance/lint/rules/naming-convention/lintTypescriptNamingConventionFinalDeclarationsConstSomeNameValue.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
const { some_name } = value;

//// [input.ts]
const { some_name } = value;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
