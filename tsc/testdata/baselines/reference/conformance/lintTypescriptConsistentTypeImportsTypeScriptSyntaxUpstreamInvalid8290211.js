//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290211.ts] ////

//// [input.ts]

import { A, B, C } from 'foo';
import { D, E, F, } from 'bar';
type T = C | F;
          

//// [input.ts]

import type { C } from 'foo';
import { A, B } from 'foo';
import type { F} from 'bar';
import { D, E } from 'bar';
type T = C | F;
          
