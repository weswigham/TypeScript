//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290472.ts] ////

//// [input.ts]

import Default /*comment1*/, /*comment2*/ { Data } from 'module';
const a: Default = '';
          

//// [input.ts]

import type Default /*comment1*/ from 'module';
import /*comment2*/ { Data } from 'module';
const a: Default = '';
          
