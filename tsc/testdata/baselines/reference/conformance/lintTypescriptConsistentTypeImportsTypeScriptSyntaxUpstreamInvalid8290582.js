//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290582.ts] ////

//// [input.ts]

import { /* comment */ A, B } from 'foo';
type T = A;
          

//// [input.ts]

import { /* comment */ type A, B } from 'foo';
type T = A;
          
