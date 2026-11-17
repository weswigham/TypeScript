//// [tests/cases/conformance/lint/rules/no-empty-object-type/lintTypescriptNoEmptyObjectTypeTypeScriptSyntaxOptionsNamePattern.ts] ////

//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
//// [input.ts]
interface IProps {} type TProps = {}; type Other = {};

//// [input.ts]
interface IProps {} type TProps = {}; type Other = {};
//// [module.ts]
export interface Shape {} export type Alias = string; export const value = 1; export class Both {}
