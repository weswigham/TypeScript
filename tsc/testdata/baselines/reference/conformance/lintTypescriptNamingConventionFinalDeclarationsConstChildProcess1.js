//// [tests/cases/conformance/lint/rules/naming-convention/lintTypescriptNamingConventionFinalDeclarationsConstChildProcess1.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
const child_process = 1;

//// [input.ts]
const child_process = 1;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
