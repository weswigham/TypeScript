//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid829070.ts] ////

//// [input.ts]

import foo from 'foo';
type Baz = (typeof foo.bar)['Baz']; // TSQualifiedName & TSTypeQuery
          

//// [input.ts]

import type foo from 'foo';
type Baz = (typeof foo.bar)['Baz']; // TSQualifiedName & TSTypeQuery
          
