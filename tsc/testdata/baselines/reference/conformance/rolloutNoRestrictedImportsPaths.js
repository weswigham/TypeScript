//// [tests/cases/conformance/lint/rules/no-restricted-imports/rolloutNoRestrictedImportsPaths.ts] ////

//// [input.ts]
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

//// [input.ts]
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
