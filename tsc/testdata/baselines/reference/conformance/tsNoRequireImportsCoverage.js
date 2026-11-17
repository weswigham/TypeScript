//// [tests/cases/conformance/lint/rules/no-require-imports/tsNoRequireImportsCoverage.ts] ////

//// [input.ts]
import { value } from "./dependency";
require("./dependency");
import forbidden = require("./dependency");
declare const path: string;
require(path);
require("./allowed");
import allowed = require("./allowed");
function local(require: (path: string) => unknown) {
    return require("./dependency");
}
value;
//// [dependency.ts]
export const value = 1;
//// [allowed.ts]
export const value = 2;
//// [globals.d.ts]
declare function require(path: string): unknown;

//// [allowed.ts]
export const value = 2;
//// [dependency.ts]
export const value = 1;
//// [input.ts]
import { value } from "./dependency";
require("./dependency");
import forbidden = require("./dependency");
declare const path: string;
require(path);
require("./allowed");
import allowed = require("./allowed");
function local(require: (path: string) => unknown) {
    return require("./dependency");
}
value;
