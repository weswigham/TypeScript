// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext","module":"preserve"},"lint":{"rules":{"@typescript-eslint/no-require-imports":["error",{"allow":["^\\./allowed$"]}]}},"files":["input.ts","dependency.ts","allowed.ts","globals.d.ts"]}
// @filename: input.ts
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
// @filename: dependency.ts
export const value = 1;
// @filename: allowed.ts
export const value = 2;
// @filename: globals.d.ts
declare function require(path: string): unknown;