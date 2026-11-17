//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290190.ts] ////

//// [input.ts]

import { A, B, C } from 'foo';
import { D, E, F, } from 'bar';
type T = A | D;
          

//// [input.ts]

import type { A} from 'foo';
import { B, C } from 'foo';
import type { D} from 'bar';
import { E, F, } from 'bar';
type T = A | D;
          
