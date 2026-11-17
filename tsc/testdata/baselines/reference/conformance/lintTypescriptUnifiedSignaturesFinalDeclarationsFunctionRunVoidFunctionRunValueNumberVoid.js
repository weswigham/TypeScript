//// [tests/cases/conformance/lint/rules/unified-signatures/lintTypescriptUnifiedSignaturesFinalDeclarationsFunctionRunVoidFunctionRunValueNumberVoid.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
{ function run(): void; function run(value: number): void; }

//// [input.ts]
{ function run(): void; function run(value: number): void; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
