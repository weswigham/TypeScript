//// [tests/cases/compiler/generateCopyJsonModule.ts] ////

//// [value.json]
{"value":42,"label":"generated"}

//// [value.json]
{ "value": 42, "label": "generated" }

//// [main.ts]
import data from "./generated/value.json";
export const value: number = data.value;
export const label: string = data.label;

//// [value.json]
{ "value": 42, "label": "generated" }
//// [main.js]
import data from "./generated/value.json";
export const value = data.value;
export const label = data.label;


//// [main.d.ts]
export declare const value: number;
export declare const label: string;
