//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290401.ts] ////

//// [input.ts]

import type /*comment*/ * as AllType from 'foo';

type T = { a: AllType };
          

//// [input.ts]

import /*comment*/ * as AllType from 'foo';

type T = { a: AllType };
          
