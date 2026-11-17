//// [tests/cases/conformance/lint/rules/unified-signatures/lintTypescriptUnifiedSignaturesFinalDeclarationsFunctionRunThisVoidValueNumberVoidFunctionRunThisStringValueStr.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
function run(this: void, value: number): void; function run(this: string, value: string): void;

//// [input.ts]
function run(this: void, value: number): void; function run(this: string, value: string): void;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
