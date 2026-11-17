//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxCombinedExistingInlineType.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
import A, { type B, C as D } from 'x'; let a: A; let d: D;

//// [input.ts]
import type { C as D } from 'x';
import type A from 'x';
import { type B } from 'x'; let a: A; let d: D;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
