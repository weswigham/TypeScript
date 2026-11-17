//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid773161.ts] ////

//// [input.ts]

import * as Type from 'foo';

type T = typeof Type;
type T = typeof Type.foo;
          

//// [input.ts]

import * as Type from 'foo';

type T = typeof Type;
type T = typeof Type.foo;
          
