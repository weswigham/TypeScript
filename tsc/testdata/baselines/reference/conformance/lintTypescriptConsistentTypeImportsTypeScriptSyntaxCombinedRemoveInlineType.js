//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxCombinedRemoveInlineType.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
import { type A, B } from 'x'; let a: A; use(B);

//// [input.ts]
import { A, B } from 'x'; let a: A; use(B);
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
