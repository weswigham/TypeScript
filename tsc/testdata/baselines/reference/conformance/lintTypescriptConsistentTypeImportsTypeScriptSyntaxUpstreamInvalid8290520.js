//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290520.ts] ////

//// [input.ts]

import { A, B } from 'foo';
type T = A;
B();
          

//// [input.ts]

import { type A, B } from 'foo';
type T = A;
B();
          
