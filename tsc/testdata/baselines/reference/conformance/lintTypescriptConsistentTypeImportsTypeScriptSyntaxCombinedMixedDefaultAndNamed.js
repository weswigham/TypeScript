//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxCombinedMixedDefaultAndNamed.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
import A, { B, C } from 'x'; let a: A; let b: B; use(C);

//// [input.ts]
import type { B} from 'x';
import type A from 'x';
import { C } from 'x'; let a: A; let b: B; use(C);
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
