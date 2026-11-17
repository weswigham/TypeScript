//// [tests/cases/conformance/lint/rules/unified-signatures/lintTypescriptUnifiedSignaturesFinalDeclarationsDeclareClassItemStaticRunVoidRunValueNumberVoid.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
declare class Item { static run(): void; run(value: number): void; }

//// [input.ts]
declare class Item { static run(): void; run(value: number): void; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
