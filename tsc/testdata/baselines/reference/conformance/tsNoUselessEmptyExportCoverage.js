//// [tests/cases/conformance/lint/rules/no-useless-empty-export/tsNoUselessEmptyExportCoverage.ts] ////

//// [input.ts]
export const value = 1;
export {};

//// [imported.ts]
import { value } from "./input";
void value;
export {};

//// [standalone.ts]
export {};
export {};

//// [imported.ts]
import { value } from "./input";
void value;

//// [input.ts]
export const value = 1;

//// [standalone.ts]
export {};
export {};
