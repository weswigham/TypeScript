//// [tests/cases/conformance/lint/rules/member-ordering/lintTypescriptMemberOrderingFinalDeclarationsClassItemValue1Run.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
class Item { value = 1; run() {} }

//// [input.ts]
class Item { value = 1; run() {} }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
