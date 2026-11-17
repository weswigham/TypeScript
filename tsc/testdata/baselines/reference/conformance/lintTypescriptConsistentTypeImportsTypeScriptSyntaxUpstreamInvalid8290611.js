//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290611.ts] ////

//// [input.ts]

import { A, B, type C } from 'foo';
import type { D } from 'deez';
const foo: A = B();
let bar: C;
let baz: D;
          

//// [input.ts]

import { type A, B, type C } from 'foo';
import type { D } from 'deez';
const foo: A = B();
let bar: C;
let baz: D;
          
