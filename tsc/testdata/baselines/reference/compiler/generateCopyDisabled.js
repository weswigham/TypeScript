//// [tests/cases/compiler/generateCopyDisabled.ts] ////

//// [template.ts]
export const value = 42;

//// [value.ts]
export const value = 0;

//// [main.ts]
import { value } from "./generated/value";
export const result = value;

//// [value.js]
export const value = 0;
//// [main.js]
import { value } from "./generated/value";
export const result = value;
