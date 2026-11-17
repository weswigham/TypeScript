//// [tests/cases/conformance/lint/rules/naming-convention/lintTypescriptNamingConventionFinalDeclarationsInterfaceItemBadMethodVoidBadPropertyString.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface Item { BadMethod(): void; BadProperty: string; }

//// [input.ts]
interface Item { BadMethod(): void; BadProperty: string; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
