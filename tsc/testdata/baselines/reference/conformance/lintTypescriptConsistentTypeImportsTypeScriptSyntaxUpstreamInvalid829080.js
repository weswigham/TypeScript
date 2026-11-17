//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid829080.ts] ////

//// [input.ts]

import * as A from 'foo';
let foo: A.Foo;
          

//// [input.ts]

import type * as A from 'foo';
let foo: A.Foo;
          
