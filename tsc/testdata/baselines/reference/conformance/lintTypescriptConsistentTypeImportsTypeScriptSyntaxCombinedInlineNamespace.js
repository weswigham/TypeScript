//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxCombinedInlineNamespace.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
import A, * as B from 'x'; let a: A; let b: B.Type;

//// [input.ts]
import type * as B from 'x';
import type A from 'x'; let a: A; let b: B.Type;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
