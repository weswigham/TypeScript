//// [tests/cases/compiler/generateCopyDeclaration.ts] ////

//// [value.d.ts]
export interface Value{value:number;label:string;}

//// [value.d.ts]
export interface Value { value: number; label: string; }

//// [main.ts]
import type { Value } from "./generated/value";
export const result: Value = { value: 42, label: "generated" };

//// [main.js]
export const result = { value: 42, label: "generated" };


//// [main.d.ts]
import type { Value } from "./generated/value";
export declare const result: Value;
