//// [tests/cases/conformance/lint/rules/member-ordering/lintTypescriptMemberOrderingFinalDeclarationsInterfaceItemValueNumberOtherNumber.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface Item { value?: number; other?: number; }

//// [input.ts]
interface Item { value?: number; other?: number; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
