//// [tests/cases/conformance/lint/rules/naming-convention/lintTypescriptNamingConventionFinalDeclarationsConstIsReadyBooleanUndefinedTrue.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
const isReady: boolean | undefined = true;

//// [input.ts]
const isReady: boolean | undefined = true;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
