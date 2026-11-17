//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxCombinedMergeExistingNamed.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
import type { C } from 'x'; import A, { B } from 'x'; let a: A; let b: B;

//// [input.ts]
import type { C , B } from 'x'; import type A from 'x'; let a: A; let b: B;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
