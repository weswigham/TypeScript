//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid829041.ts] ////

//// [input.ts]

import { A as a, B as b } from 'foo';
let foo: a;
let bar: b;
          

//// [input.ts]

import type { A as a, B as b } from 'foo';
let foo: a;
let bar: b;
          
