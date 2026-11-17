//// [tests/cases/conformance/lint/rules/no-import-type-side-effects/tsNoImportTypeSideEffectsCoverage.ts] ////

//// [dependency.d.ts]
declare module "coverage-types" {
    export interface First {
        first: number;
    }
    export interface Second {
        second: string;
    }
    export const runtime: number;
}

//// [input.ts]
import { type First, type Second as Alias } from "coverage-types";

import type { First as TopLevel } from "coverage-types";
import { type Second, runtime } from "coverage-types";
import "coverage-types";

type Combined = First & Alias & TopLevel & Second;
runtime;

//// [input.ts]
import type { First, Second as Alias } from "coverage-types";

import type { First as TopLevel } from "coverage-types";
import { type Second, runtime } from "coverage-types";
import "coverage-types";

type Combined = First & Alias & TopLevel & Second;
runtime;
