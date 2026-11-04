//// [tests/cases/compiler/generateCopyParallel.ts] ////

//// [first.ts]
export const first = 1;

//// [second.ts]
export const second = 2;

//// [first.ts]
export const first = 1;

//// [second.ts]
export const second = 2;

//// [main.ts]
import { first } from "./generated/first";
import { second } from "./generated/second";
export const result = first + second;

//// [first.js]
export const first = 1;
//// [second.js]
export const second = 2;
//// [main.js]
import { first } from "./generated/first";
import { second } from "./generated/second";
export const result = first + second;


//// [first.d.ts]
export declare const first = 1;
//// [second.d.ts]
export declare const second = 2;
//// [main.d.ts]
export declare const result: number;
