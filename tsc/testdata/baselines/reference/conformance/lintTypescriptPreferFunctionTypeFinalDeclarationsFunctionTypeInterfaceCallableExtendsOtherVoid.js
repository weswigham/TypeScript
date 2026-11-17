//// [tests/cases/conformance/lint/rules/prefer-function-type/lintTypescriptPreferFunctionTypeFinalDeclarationsFunctionTypeInterfaceCallableExtendsOtherVoid.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface Callable extends Other { (): void; }

//// [input.ts]
interface Callable extends Other { (): void; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
