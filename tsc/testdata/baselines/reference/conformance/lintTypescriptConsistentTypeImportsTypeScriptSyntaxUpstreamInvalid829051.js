//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid829051.ts] ////

//// [input.ts]

import Foo from 'foo';
type Bar = typeof Foo; // TSTypeQuery
          

//// [input.ts]

import type Foo from 'foo';
type Bar = typeof Foo; // TSTypeQuery
          
