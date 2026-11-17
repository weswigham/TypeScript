//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290512.ts] ////

//// [input.ts]

import { A, B } from 'foo';

let foo: A;
B();
          

//// [input.ts]

import { type A, B } from 'foo';

let foo: A;
B();
          
