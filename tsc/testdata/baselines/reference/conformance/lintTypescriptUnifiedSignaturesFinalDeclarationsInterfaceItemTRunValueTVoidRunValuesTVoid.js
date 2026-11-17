//// [tests/cases/conformance/lint/rules/unified-signatures/lintTypescriptUnifiedSignaturesFinalDeclarationsInterfaceItemTRunValueTVoidRunValuesTVoid.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface Item<T> { run(value: T): void; run(values: T[]): void; }

//// [input.ts]
interface Item<T> { run(value: T): void; run(values: T[]): void; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
