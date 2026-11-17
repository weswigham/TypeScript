//// [tests/cases/conformance/lint/rules/triple-slash-reference/tsTripleSlashReferenceCoverage.ts] ////

//// [dependency.d.ts]
export interface Shape { size: number; }

//// [index.d.ts]
export const value: number;

//// [input.ts]
/// <reference path="./dependency.d.ts" />
/// <reference types="coverage-types" />
import { value } from "coverage-types";
void value;

//// [valid.ts]
/// <reference lib="esnext" />
import type { Shape } from "./dependency";
const shape: Shape = { size: 1 };
void shape;

//// [input.ts]
/// <reference path="./dependency.d.ts" />
/// <reference types="coverage-types" />
import { value } from "coverage-types";
void value;
//// [valid.ts]
/// <reference lib="esnext" />
import type { Shape } from "./dependency";
const shape: Shape = { size: 1 };
void shape;
