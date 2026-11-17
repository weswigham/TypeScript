//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290202.ts] ////

//// [input.ts]

import { A, B, C } from 'foo';
import { D, E, F, } from 'bar';
type T = B | E;
          

//// [input.ts]

import type { B} from 'foo';
import { A, C } from 'foo';
import type { E} from 'bar';
import { D, F, } from 'bar';
type T = B | E;
          
