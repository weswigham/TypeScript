//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290312.ts] ////

//// [input.ts]

import type Type from 'foo';

type T = typeof Type;
type T = typeof Type.foo;
          

//// [input.ts]

import Type from 'foo';

type T = typeof Type;
type T = typeof Type.foo;
          
