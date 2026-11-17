//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid829020.ts] ////

//// [input.ts]

import Foo from 'foo';
let foo: Foo;
          

//// [input.ts]

import type Foo from 'foo';
let foo: Foo;
          
