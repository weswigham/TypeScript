//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid773140.ts] ////

//// [input.ts]

import Type from 'foo';

type T = typeof Type;
type T = typeof Type.foo;
          

//// [input.ts]

import Type from 'foo';

type T = typeof Type;
type T = typeof Type.foo;
          
