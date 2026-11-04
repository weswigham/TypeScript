//// [tests/cases/compiler/generateCopyDiagnostics.ts] ////

//// [template.ts]
export const value: number = "generated type error";

//// [value.ts]
export const value: number = "generated type error";

//// [main.ts]
import { value } from "./generated/value";
export const result = value;



!!!! File /project/generated/value.js missing from original emit, but present in noCheck emit
//// [value.js]
export const value = "generated type error";


!!!! File /project/main.js missing from original emit, but present in noCheck emit
//// [main.js]
import { value } from "./generated/value";
export const result = value;
