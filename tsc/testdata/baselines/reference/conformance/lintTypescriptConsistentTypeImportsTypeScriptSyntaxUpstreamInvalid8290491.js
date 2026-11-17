//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290491.ts] ////

//// [input.ts]

import { A, B, type C } from 'foo';
type T = A | C;
const b = B;
          

//// [input.ts]

import type { A} from 'foo';
import { B, type C } from 'foo';
type T = A | C;
const b = B;
          
