//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290551.ts] ////

//// [input.ts]

import A, { B, C } from 'foo';
type T = B;
type U = C;
A();
          

//// [input.ts]

import A, { type B, type C } from 'foo';
type T = B;
type U = C;
A();
          
