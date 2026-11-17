//// [tests/cases/conformance/lint/rules/naming-convention/lintTypescriptNamingConventionFinalDeclarationsConstBadNameStringNull.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
const badName: string | null = '';

//// [input.ts]
const badName: string | null = '';
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
