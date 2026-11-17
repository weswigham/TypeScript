//// [tests/cases/conformance/lint/rules/unified-signatures/lintTypescriptUnifiedSignaturesFinalDeclarationsFunctionRunVoidFunctionRunValueNumberOtherNumberVoid.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
function run(): void; function run(value: number, other: number): void;

//// [input.ts]
function run(): void; function run(value: number, other: number): void;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
