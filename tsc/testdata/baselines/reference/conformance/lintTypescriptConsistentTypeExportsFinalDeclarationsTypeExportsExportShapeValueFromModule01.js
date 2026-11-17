//// [tests/cases/conformance/lint/rules/consistent-type-exports/lintTypescriptConsistentTypeExportsFinalDeclarationsTypeExportsExportShapeValueFromModule01.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
export { Shape, value } from './module';

//// [input.ts]
export { type Shape, value } from './module';
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
