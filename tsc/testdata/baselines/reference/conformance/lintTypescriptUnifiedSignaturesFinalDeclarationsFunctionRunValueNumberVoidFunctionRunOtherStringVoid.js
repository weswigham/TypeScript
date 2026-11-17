//// [tests/cases/conformance/lint/rules/unified-signatures/lintTypescriptUnifiedSignaturesFinalDeclarationsFunctionRunValueNumberVoidFunctionRunOtherStringVoid.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
function run(value: number): void; function run(other: string): void;

//// [input.ts]
function run(value: number): void; function run(other: string): void;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
