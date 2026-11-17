//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290132.ts] ////

//// [input.ts]

import { A, B, C, D } from 'foo';
const foo: A = B();
type T = { bar: C; baz: D };
          

//// [input.ts]

import type { A, C, D } from 'foo';
import { B } from 'foo';
const foo: A = B();
type T = { bar: C; baz: D };
          
