//// [tests/cases/conformance/lint/rules/member-ordering/lintTypescriptMemberOrderingFinalDeclarationsInterfaceItemItem10NumberItem2Number.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface Item { item10: number; item2: number; }

//// [input.ts]
interface Item { item10: number; item2: number; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
