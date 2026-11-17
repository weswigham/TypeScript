//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid773110.ts] ////

//// [input.ts]

import type Type from 'foo';

type T = typeof Type;
type T = typeof Type.foo;
        

//// [input.ts]

import type Type from 'foo';

type T = typeof Type;
type T = typeof Type.foo;
        
