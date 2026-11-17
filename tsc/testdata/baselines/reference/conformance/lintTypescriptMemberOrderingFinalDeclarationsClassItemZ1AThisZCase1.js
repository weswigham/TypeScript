//// [tests/cases/conformance/lint/rules/member-ordering/lintTypescriptMemberOrderingFinalDeclarationsClassItemZ1AThisZCase1.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
class Item { z = 1; a = () => this.z; }

//// [input.ts]
class Item { z = 1; a = () => this.z; }
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
