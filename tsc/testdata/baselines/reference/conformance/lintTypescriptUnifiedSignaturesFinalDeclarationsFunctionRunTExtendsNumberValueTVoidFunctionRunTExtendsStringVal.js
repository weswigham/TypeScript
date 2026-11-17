//// [tests/cases/conformance/lint/rules/unified-signatures/lintTypescriptUnifiedSignaturesFinalDeclarationsFunctionRunTExtendsNumberValueTVoidFunctionRunTExtendsStringVal.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
function run<T extends number>(value: T[]): void; function run<T extends string>(value: T): void;

//// [input.ts]
function run<T extends number>(value: T[]): void; function run<T extends string>(value: T): void;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
