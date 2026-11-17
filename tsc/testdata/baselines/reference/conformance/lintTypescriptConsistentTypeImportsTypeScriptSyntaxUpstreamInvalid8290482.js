//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290482.ts] ////

//// [input.ts]

import { type A, B } from 'foo';
type T = A;
const b = B;
          

//// [input.ts]

import { A, B } from 'foo';
type T = A;
const b = B;
          
