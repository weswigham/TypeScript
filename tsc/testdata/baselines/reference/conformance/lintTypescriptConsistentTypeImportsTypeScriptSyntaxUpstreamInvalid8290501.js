//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290501.ts] ////

//// [input.ts]

import { A, B } from 'foo';
let foo: A;
let bar: B;
          

//// [input.ts]

import { type A, type B } from 'foo';
let foo: A;
let bar: B;
          
