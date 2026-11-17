// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"target":"esnext"},"lint":{"rules":{"no-restricted-imports":["error",{"paths":["blocked",{"name":"named","importNames":["bad","default"],"message":"Use the public API."},{"name":"allowed","allowImportNames":["safe","other"]},{"name":"typed","importNames":["bad"],"allowTypeImports":true},{"name":"typed-path","allowTypeImports":true}]}]}},"files":["input.ts"]}
// @filename: input.ts
import "blocked";
import value, { bad as alias, safe } from "named";
import * as all from "named";
export { bad as renamed } from "named";
export * as namespace from "named";
import { safe, bad } from "allowed";
import * as everything from "allowed";
import type { bad } from "typed";
import { type bad as T, bad as runtime } from "typed";
export { type bad, bad as runtime } from "typed";
export type * from "typed-path";
import type typeModule = require("typed-path");
import moduleValue = require("typed-path");
import("blocked");
require("blocked");
type Dynamic = import("blocked").T;