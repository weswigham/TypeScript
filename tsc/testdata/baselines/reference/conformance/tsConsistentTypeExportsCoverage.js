//// [tests/cases/conformance/lint/rules/consistent-type-exports/tsConsistentTypeExportsCoverage.ts] ////

//// [provider.ts]
export interface Shape { value: number; }
export type Alias = string;
export const value = 1;
export class Both { value = 1; }

//// [input.ts]
export { Shape } from "./provider";
export { Alias, value } from "./provider";
export type { Shape as ValidShape } from "./provider";
export { value as validValue, Both } from "./provider";
type Local = { value: number };
export { Local };
export type { Local as ValidLocal };

//// [input.ts]
export type { Shape } from "./provider";
export type { Alias } from './provider';
export { value } from "./provider";
export type { Shape as ValidShape } from "./provider";
export { value as validValue, Both } from "./provider";
type Local = { value: number };
export type { Local };
export type { Local as ValidLocal };
//// [provider.ts]
export interface Shape { value: number; }
export type Alias = string;
export const value = 1;
export class Both { value = 1; }
