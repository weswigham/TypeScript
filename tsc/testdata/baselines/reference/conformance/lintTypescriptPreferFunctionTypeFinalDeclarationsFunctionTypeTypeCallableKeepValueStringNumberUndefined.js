//// [tests/cases/conformance/lint/rules/prefer-function-type/lintTypescriptPreferFunctionTypeFinalDeclarationsFunctionTypeTypeCallableKeepValueStringNumberUndefined.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
type Callable = { /* keep */ (value: string): number } | undefined;

//// [input.ts]
type Callable = /* keep */ ((value: string) => number) | undefined;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
