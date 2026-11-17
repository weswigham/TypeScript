//// [tests/cases/conformance/lint/rules/sort-imports/rolloutSortImports.ts] ////

//// [input.ts]
import { zeta, beta as alpha, gamma } from "one";
import named from "two";
import * as namespace from "three";
import "four";

//// [input.ts]
import { beta as alpha, gamma, zeta } from "one";
import named from "two";
import * as namespace from "three";
import "four";
