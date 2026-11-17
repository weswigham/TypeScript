//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxCombinedComments.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
import /* before */ A, { /* named */ B } from 'x'; let a: A; let b: B;

//// [input.ts]
import type { /* named */ B } from 'x';
import type /* before */ A from 'x'; let a: A; let b: B;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
