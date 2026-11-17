//// [tests/cases/conformance/lint/rules/naming-convention/lintTypescriptNamingConventionFinalDeclarationsConstExportedName1ExportExportedName.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
const ExportedName = 1; export { ExportedName };

//// [input.ts]
const ExportedName = 1; export { ExportedName };
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
