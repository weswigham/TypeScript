//// [tests/cases/conformance/lint/rules/member-ordering/lintTypescriptMemberOrderingFinalDeclarationsInterfaceItemItem2NumberItem10Number.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface Item { item2: number; item10: number; }

//// [input.ts]
interface Item { item2: number; item10: number; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
