//// [tests/cases/conformance/lint/rules/consistent-type-exports/lintTypescriptConsistentTypeExportsFinalDeclarationsTypeExportsNamespaceTypeNSExportInterfaceShapeExportTypeNS.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
namespace TypeNS { export interface Shape {} } export { TypeNS };

//// [input.ts]
namespace TypeNS { export interface Shape {} } export type { TypeNS };
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
