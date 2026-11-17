//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290171.ts] ////

//// [input.ts]

import { C, D, E } from 'bar';
import type { Already2 } from 'bar';
type T = { c: C; d: D };
          

//// [input.ts]

import { E } from 'bar';
import type { Already2 , C, D} from 'bar';
type T = { c: C; d: D };
          
