//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290452.ts] ////

//// [input.ts]

import Default, * as Rest from 'module';
const a: Default = '';
const b: Rest.A = '';
          

//// [input.ts]

import type * as Rest from 'module';
import type Default from 'module';
const a: Default = '';
const b: Rest.A = '';
          
