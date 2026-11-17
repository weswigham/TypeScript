//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290302.ts] ////

//// [input.ts]

import * as Type from 'foo';

type T = typeof Type;
type T = typeof Type.foo;
          

//// [input.ts]

import type * as Type from 'foo';

type T = typeof Type;
type T = typeof Type.foo;
          
