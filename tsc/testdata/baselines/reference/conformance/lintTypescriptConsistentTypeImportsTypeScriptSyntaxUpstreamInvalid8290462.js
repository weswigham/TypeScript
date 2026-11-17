//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290462.ts] ////

//// [input.ts]

import Default, /*comment*/ * as Rest from 'module';
const a: Default = '';
          

//// [input.ts]

import type Default from 'module';
import /*comment*/ * as Rest from 'module';
const a: Default = '';
          
