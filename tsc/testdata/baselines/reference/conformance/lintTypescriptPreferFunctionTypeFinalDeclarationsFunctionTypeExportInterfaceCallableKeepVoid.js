//// [tests/cases/conformance/lint/rules/prefer-function-type/lintTypescriptPreferFunctionTypeFinalDeclarationsFunctionTypeExportInterfaceCallableKeepVoid.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
export interface Callable { /** keep */ (): void; }

//// [input.ts]
/** keep */
export type Callable = () => void;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
