//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290122.ts] ////

//// [input.ts]

import { A, B, C } from 'foo';
const foo: A = B();
let bar: C;
          

//// [input.ts]

import type { A, C } from 'foo';
import { B } from 'foo';
const foo: A = B();
let bar: C;
          
