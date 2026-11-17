//// [tests/cases/conformance/lint/rules/prefer-function-type/lintTypescriptPreferFunctionTypeFinalDeclarationsFunctionTypeInterfaceCallableValueStringNumber.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface Callable { (value: string): number; }

//// [input.ts]
type Callable = (value: string) => number;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
