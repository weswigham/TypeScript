//// [tests/cases/conformance/lint/rules/unified-signatures/lintTypescriptUnifiedSignaturesFinalDeclarationsInterfaceItemRunVoidRunValueNumberOtherNumberRestStringVoid.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface Item { run(): void; run(value: number, other?: number, ...rest: string[]): void; }

//// [input.ts]
interface Item { run(): void; run(value: number, other?: number, ...rest: string[]): void; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
