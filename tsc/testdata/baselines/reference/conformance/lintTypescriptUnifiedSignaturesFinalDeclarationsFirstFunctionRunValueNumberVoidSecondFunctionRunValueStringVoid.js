//// [tests/cases/conformance/lint/rules/unified-signatures/lintTypescriptUnifiedSignaturesFinalDeclarationsFirstFunctionRunValueNumberVoidSecondFunctionRunValueStringVoid.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
/** first */ function run(value: number): void; /** second */ function run(value: string): void;

//// [input.ts]
/** first */ function run(value: number): void; /** second */ function run(value: string): void;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
