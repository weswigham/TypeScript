//// [tests/cases/conformance/lint/rules/naming-convention/lintTypescriptNamingConventionFinalDeclarationsConstUnusedName1FunctionUsedNameUnusedParameterStringUsedName.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
const UnusedName = 1; function UsedName(UnusedParameter: string) {} UsedName('');

//// [input.ts]
const UnusedName = 1; function UsedName(UnusedParameter: string) {} UsedName('');
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
