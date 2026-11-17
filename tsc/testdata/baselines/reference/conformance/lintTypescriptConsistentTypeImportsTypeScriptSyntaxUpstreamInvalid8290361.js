//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290361.ts] ////

//// [input.ts]

import * as Type from 'foo';

export type { Type }; // is a type-only export
          

//// [input.ts]

import type * as Type from 'foo';

export type { Type }; // is a type-only export
          
