//// [tests/cases/compiler/generateCopyFileKinds.ts] ////

//// [input.json]
{ "value": 42 }

//// [input.yaml]
value: 42

//// [input.sql]
SELECT 42 AS value;

//// [input.d.ts]
export interface Value { value: number; }

//// [input.tsx]
export const value = <div>42</div>;

//// [output.d.ts]
export interface Value { value: number; }

//// [output.json]
{ "value": 42 }

//// [output.sql]
SELECT 42 AS value;

//// [output.tsx]
export const value = <div>42</div>;

//// [output.yaml]
value: 42

//// [main.ts]
export const main = 1;

//// [main.js]
export const main = 1;
