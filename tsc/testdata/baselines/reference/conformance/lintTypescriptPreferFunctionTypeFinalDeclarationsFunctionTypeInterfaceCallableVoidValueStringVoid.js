//// [tests/cases/conformance/lint/rules/prefer-function-type/lintTypescriptPreferFunctionTypeFinalDeclarationsFunctionTypeInterfaceCallableVoidValueStringVoid.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface Callable { (): void; (value: string): void; }

//// [input.ts]
interface Callable { (): void; (value: string): void; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
