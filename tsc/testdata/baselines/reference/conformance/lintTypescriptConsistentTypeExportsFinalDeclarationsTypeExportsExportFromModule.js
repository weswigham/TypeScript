//// [tests/cases/conformance/lint/rules/consistent-type-exports/lintTypescriptConsistentTypeExportsFinalDeclarationsTypeExportsExportFromModule.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
export * from './module';

//// [input.ts]
export * from './module';
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
