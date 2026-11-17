//// [tests/cases/conformance/lint/rules/no-restricted-imports/rolloutNoRestrictedImportsPatterns.ts] ////

//// [input.ts]
import "private/module";
import "private/public";
import "PRIVATE/MODULE";
import { secret, unsafeMethod, safe } from "@scope/pkg/internal/module";
import type { secret as T } from "@scope/pkg/internal/module";
import * as namespace from "@scope/pkg/internal/module";
export { unsafeMethod } from "@scope/pkg/internal/module";
export * from "pkg/private";
import { unsafe, safe } from "pkg/private";
import "pkg/public";
import { bad } from "CaseSensitive";
import { bad as permitted } from "casesensitive";

//// [input.ts]
import "private/module";
import "private/public";
import "PRIVATE/MODULE";
import { secret, unsafeMethod, safe } from "@scope/pkg/internal/module";
import type { secret as T } from "@scope/pkg/internal/module";
import * as namespace from "@scope/pkg/internal/module";
export { unsafeMethod } from "@scope/pkg/internal/module";
export * from "pkg/private";
import { unsafe, safe } from "pkg/private";
import "pkg/public";
import { bad } from "CaseSensitive";
import { bad as permitted } from "casesensitive";
