//// [tests/cases/conformance/lint/rules/prefer-function-type/lintTypescriptPreferFunctionTypeFinalDeclarationsFunctionTypeExportDefaultInterfaceCallableVoid.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
export default interface Callable { (): void; }

//// [input.ts]
export default interface Callable { (): void; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
