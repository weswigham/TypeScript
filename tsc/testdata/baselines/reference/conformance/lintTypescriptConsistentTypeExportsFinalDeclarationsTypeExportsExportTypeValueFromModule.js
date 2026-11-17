//// [tests/cases/conformance/lint/rules/consistent-type-exports/lintTypescriptConsistentTypeExportsFinalDeclarationsTypeExportsExportTypeValueFromModule.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
export type { value } from './module';

//// [input.ts]
export type { value } from './module';
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
