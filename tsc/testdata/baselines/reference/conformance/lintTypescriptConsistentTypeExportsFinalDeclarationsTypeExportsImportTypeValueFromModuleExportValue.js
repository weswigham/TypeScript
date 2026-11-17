//// [tests/cases/conformance/lint/rules/consistent-type-exports/lintTypescriptConsistentTypeExportsFinalDeclarationsTypeExportsImportTypeValueFromModuleExportValue.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
import type { value } from './module'; export { value };

//// [input.ts]
import type { value } from './module'; export type { value };
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
