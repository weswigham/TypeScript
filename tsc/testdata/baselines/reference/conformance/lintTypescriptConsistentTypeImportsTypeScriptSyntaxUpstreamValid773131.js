//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid773131.ts] ////

//// [input.ts]

import type * as Type from 'foo';

type T = typeof Type;
type T = typeof Type.foo;
        

//// [input.ts]

import type * as Type from 'foo';

type T = typeof Type;
type T = typeof Type.foo;
        
