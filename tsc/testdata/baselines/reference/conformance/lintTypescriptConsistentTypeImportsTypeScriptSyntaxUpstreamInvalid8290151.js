//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290151.ts] ////

//// [input.ts]

import A, { B } from 'foo';
B();
type T = A;
          

//// [input.ts]

import type A from 'foo';
import { B } from 'foo';
B();
type T = A;
          
