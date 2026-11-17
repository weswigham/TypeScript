//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxCombinedNamedCommentsAndDefaultValue.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
import A, { /* named */ B } from 'x'; use(A); let b: B;

//// [input.ts]
import type { /* named */ B } from 'x';
import A from 'x'; use(A); let b: B;
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
