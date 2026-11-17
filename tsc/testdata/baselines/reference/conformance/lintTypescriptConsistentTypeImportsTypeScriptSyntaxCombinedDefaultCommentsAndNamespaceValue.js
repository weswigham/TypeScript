//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxCombinedDefaultCommentsAndNamespaceValue.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
import A /* default */, /* namespace */ * as B from 'x'; let a: A; use(B);

//// [input.ts]
import type A /* default */ from 'x';
import /* namespace */ * as B from 'x'; let a: A; use(B);
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
