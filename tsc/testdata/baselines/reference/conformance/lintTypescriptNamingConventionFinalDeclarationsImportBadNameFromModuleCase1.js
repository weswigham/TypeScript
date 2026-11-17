//// [tests/cases/conformance/lint/rules/naming-convention/lintTypescriptNamingConventionFinalDeclarationsImportBadNameFromModuleCase1.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
import { bad_name } from './module';

//// [input.ts]
import { bad_name } from './module';
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
