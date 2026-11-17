//// [tests/cases/conformance/lint/rules/no-empty-object-type/lintTypescriptNoEmptyObjectTypeTypeScriptSyntaxOptionsNameLookbehind.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface Allowed {} type Allowed = {}; interface Denied {}

//// [input.ts]
interface Allowed {} type Allowed = {}; interface Denied {}
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
