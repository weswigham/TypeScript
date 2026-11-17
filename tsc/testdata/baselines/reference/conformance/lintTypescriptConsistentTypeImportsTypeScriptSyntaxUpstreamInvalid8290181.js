//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290181.ts] ////

//// [input.ts]

import A, { /* comment */ B } from 'foo';
type T = B;
          

//// [input.ts]

import type { /* comment */ B } from 'foo';
import A from 'foo';
type T = B;
          
