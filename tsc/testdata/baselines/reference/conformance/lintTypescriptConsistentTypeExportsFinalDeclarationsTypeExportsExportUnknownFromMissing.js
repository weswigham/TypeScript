//// [tests/cases/conformance/lint/rules/consistent-type-exports/lintTypescriptConsistentTypeExportsFinalDeclarationsTypeExportsExportUnknownFromMissing.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
export { unknown } from './missing';

//// [input.ts]
export { unknown } from './missing';
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
