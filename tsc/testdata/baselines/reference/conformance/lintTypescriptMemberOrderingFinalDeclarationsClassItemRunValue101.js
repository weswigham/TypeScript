//// [tests/cases/conformance/lint/rules/member-ordering/lintTypescriptMemberOrderingFinalDeclarationsClassItemRunValue101.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
class Item { run() {} value = 1; }

//// [input.ts]
class Item { run() {} value = 1; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
