//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxCombinedEmptyNamed.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
import A, {} from 'x'; let a: A;

//// [input.ts]
import type A from 'x'; let a: A;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
