//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290350.ts] ////

//// [input.ts]

import { Type } from 'foo';

export type { Type }; // is a type-only export
          

//// [input.ts]

import type { Type } from 'foo';

export type { Type }; // is a type-only export
          
