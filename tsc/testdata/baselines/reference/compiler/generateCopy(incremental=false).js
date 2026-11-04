//// [tests/cases/compiler/generateCopy.ts] ////

//// [template.ts]
export const value = 42;

//// [value.ts]
export const value = 42;

//// [main.ts]
import { value } from "./generated/value";
export const result = value.toFixed();

//// [value.js]
export const value = 42;
//// [main.js]
import { value } from "./generated/value";
export const result = value.toFixed();


//// [value.d.ts]
export declare const value = 42;
//// [main.d.ts]
export declare const result: string;
