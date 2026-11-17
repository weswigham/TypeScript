//// [tests/cases/conformance/lint/rules/consistent-type-exports/lintTypescriptConsistentTypeExportsFinalDeclarationsTypeExportsTypeShapeStringExportTypeKeepShapeShape.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
type Shape = string; export { type /* keep */ Shape, Shape };

//// [input.ts]
type Shape = string; export type { /* keep */ Shape, Shape };
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
