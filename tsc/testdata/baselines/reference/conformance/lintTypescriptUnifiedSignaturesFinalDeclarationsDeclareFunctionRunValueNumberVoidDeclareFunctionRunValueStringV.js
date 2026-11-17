//// [tests/cases/conformance/lint/rules/unified-signatures/lintTypescriptUnifiedSignaturesFinalDeclarationsDeclareFunctionRunValueNumberVoidDeclareFunctionRunValueStringV.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
declare function run(value: number): void; declare function run(value: string): void;

//// [input.ts]
declare function run(value: number): void; declare function run(value: string): void;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
