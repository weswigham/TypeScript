//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290291.ts] ////

//// [input.ts]

import { Type } from 'foo';

type T = typeof Type;
type T = typeof Type.foo;
          

//// [input.ts]

import type { Type } from 'foo';

type T = typeof Type;
type T = typeof Type.foo;
          
