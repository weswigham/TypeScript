//// [tests/cases/conformance/lint/rules/naming-convention/lintTypescriptNamingConventionFinalDeclarationsConstIsReadyTrue.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
const _isReady = true;

//// [input.ts]
const _isReady = true;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
