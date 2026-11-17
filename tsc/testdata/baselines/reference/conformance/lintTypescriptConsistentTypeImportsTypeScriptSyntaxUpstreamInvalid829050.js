//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid829050.ts] ////

//// [input.ts]

import Foo from 'foo';
type Bar = typeof Foo; // TSTypeQuery
          

//// [input.ts]

import type Foo from 'foo';
type Bar = typeof Foo; // TSTypeQuery
          
