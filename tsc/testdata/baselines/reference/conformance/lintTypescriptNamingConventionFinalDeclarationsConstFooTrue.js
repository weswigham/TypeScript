//// [tests/cases/conformance/lint/rules/naming-convention/lintTypescriptNamingConventionFinalDeclarationsConstFooTrue.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
const foo = true;

//// [input.ts]
const foo = true;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
