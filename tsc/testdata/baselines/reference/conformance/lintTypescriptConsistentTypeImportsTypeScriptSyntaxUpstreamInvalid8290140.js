//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290140.ts] ////

//// [input.ts]

import A, { B, C, D } from 'foo';
B();
type T = { foo: A; bar: C; baz: D };
          

//// [input.ts]

import type { C, D } from 'foo';
import type A from 'foo';
import { B } from 'foo';
B();
type T = { foo: A; bar: C; baz: D };
          
