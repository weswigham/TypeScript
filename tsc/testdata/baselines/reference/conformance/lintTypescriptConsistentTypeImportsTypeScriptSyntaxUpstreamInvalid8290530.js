//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290530.ts] ////

//// [input.ts]

import { A } from 'foo';
import { B } from 'foo';
type T = A;
type U = B;
          

//// [input.ts]

import { type A } from 'foo';
import { type B } from 'foo';
type T = A;
type U = B;
          
