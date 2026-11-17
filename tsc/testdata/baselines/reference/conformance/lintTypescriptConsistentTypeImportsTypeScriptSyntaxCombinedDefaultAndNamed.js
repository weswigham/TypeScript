//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxCombinedDefaultAndNamed.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
import A, { B } from 'x'; let a: A; let b: B;

//// [input.ts]
import type { B } from 'x';
import type A from 'x'; let a: A; let b: B;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
