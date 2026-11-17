//// [tests/cases/conformance/lint/rules/unified-signatures/lintTypescriptUnifiedSignaturesFinalDeclarationsInterfaceItemRunValuesNumberVoidRunValuesStringVoid.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface Item { run(...values: number[]): void; run(...values: string[]): void; }

//// [input.ts]
interface Item { run(...values: number[]): void; run(...values: string[]): void; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
