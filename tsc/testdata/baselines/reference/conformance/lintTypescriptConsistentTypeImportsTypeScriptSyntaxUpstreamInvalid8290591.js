//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290591.ts] ////

//// [input.ts]

import { B, /* comment */ A } from 'foo';
type T = A;
          

//// [input.ts]

import { B, /* comment */ type A } from 'foo';
type T = A;
          
