//// [tests/cases/conformance/lint/rules/member-ordering/lintTypescriptMemberOrderingFinalDeclarationsInterfaceItemRunVoidValueNumber.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface Item { run(): void; value: number; }

//// [input.ts]
interface Item { run(): void; value: number; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
