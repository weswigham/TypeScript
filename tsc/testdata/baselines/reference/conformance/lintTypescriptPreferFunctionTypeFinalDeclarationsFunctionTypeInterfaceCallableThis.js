//// [tests/cases/conformance/lint/rules/prefer-function-type/lintTypescriptPreferFunctionTypeFinalDeclarationsFunctionTypeInterfaceCallableThis.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface Callable { (): this; }

//// [input.ts]
interface Callable { (): this; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
