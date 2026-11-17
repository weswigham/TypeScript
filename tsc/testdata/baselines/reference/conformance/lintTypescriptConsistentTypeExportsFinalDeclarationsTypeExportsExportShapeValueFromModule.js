//// [tests/cases/conformance/lint/rules/consistent-type-exports/lintTypescriptConsistentTypeExportsFinalDeclarationsTypeExportsExportShapeValueFromModule.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
export { Shape, value } from './module';

//// [input.ts]
export type { Shape } from './module';
export { value } from './module';
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
