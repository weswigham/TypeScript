//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290441.ts] ////

//// [input.ts]

import Default, * as Rest from 'module';
const a: Default = '';
          

//// [input.ts]

import type Default from 'module';
import * as Rest from 'module';
const a: Default = '';
          
