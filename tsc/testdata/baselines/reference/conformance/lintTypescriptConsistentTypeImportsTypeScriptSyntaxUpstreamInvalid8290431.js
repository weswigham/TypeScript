//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290431.ts] ////

//// [input.ts]

import Default, * as Rest from 'module';
const a: Rest.A = '';
          

//// [input.ts]

import type * as Rest from 'module';
import Default from 'module';
const a: Rest.A = '';
          
