//// [tests/cases/conformance/lint/rules/consistent-type-imports/tsConsistentTypeImportsCoverage.ts] ////

//// [provider.ts]
export interface Shape { value: number; }
export type Alias = string;
export interface UnusedShape { unused: boolean; }
export const value = 1;

//// [input.ts]
import { Shape } from "./provider";
import { Alias, value } from "./provider";
import type { Shape as ValidShape } from "./provider";
import { UnusedShape } from "./provider";
const shape: Shape = { value };
const alias: Alias = "label";
const validShape: ValidShape = shape;
export { shape, alias, validShape };

//// [input.ts]
import type { Shape } from "./provider";
import { value } from "./provider";
import type { Shape as ValidShape , Alias} from "./provider";
import { UnusedShape } from "./provider";
const shape: Shape = { value };
const alias: Alias = "label";
const validShape: ValidShape = shape;
export { shape, alias, validShape };
//// [provider.ts]
export interface Shape { value: number; }
export type Alias = string;
export interface UnusedShape { unused: boolean; }
export const value = 1;
