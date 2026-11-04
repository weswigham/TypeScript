//// [tests/cases/compiler/generateCopyFormatting.ts] ////

//// [template.ts]
export function value(){return 42;}

//// [value.ts]
export function value() { return 42; }

//// [main.ts]
import { value } from "./generated/value";
export const result = value();

//// [value.js]
export function value() { return 42; }
//# sourceMappingURL=value.js.map
//// [main.js]
import { value } from "./generated/value";
export const result = value();
//# sourceMappingURL=main.js.map

//// [value.d.ts]
export declare function value(): number;
//// [main.d.ts]
export declare const result: number;
