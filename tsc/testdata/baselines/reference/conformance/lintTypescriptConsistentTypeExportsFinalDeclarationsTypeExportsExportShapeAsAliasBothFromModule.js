//// [tests/cases/conformance/lint/rules/consistent-type-exports/lintTypescriptConsistentTypeExportsFinalDeclarationsTypeExportsExportShapeAsAliasBothFromModule.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
export { Shape as Alias, Both } from './module';

//// [input.ts]
export type { Shape as Alias } from './module';
export { Both } from './module';
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
