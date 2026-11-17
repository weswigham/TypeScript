//// [tests/cases/conformance/lint/rules/member-ordering/lintTypescriptMemberOrderingFinalDeclarationsClassItemPrivateStaticValue1PublicStaticOther1.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
class Item { private static value = 1; public static other = 1; }

//// [input.ts]
class Item { private static value = 1; public static other = 1; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
