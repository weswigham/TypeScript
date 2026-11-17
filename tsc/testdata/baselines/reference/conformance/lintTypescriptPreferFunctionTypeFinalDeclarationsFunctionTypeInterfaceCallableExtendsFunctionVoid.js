//// [tests/cases/conformance/lint/rules/prefer-function-type/lintTypescriptPreferFunctionTypeFinalDeclarationsFunctionTypeInterfaceCallableExtendsFunctionVoid.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface Callable extends Function { (): void; }

//// [input.ts]
type Callable = () => void;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
