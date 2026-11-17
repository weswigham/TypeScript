//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290112.ts] ////

//// [input.ts]

import { A, B } from 'foo';
const foo: A = B();
          

//// [input.ts]

import type { A} from 'foo';
import { B } from 'foo';
const foo: A = B();
          
