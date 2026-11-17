//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290101.ts] ////

//// [input.ts]

import A, {} from 'foo';
let foo: A;
          

//// [input.ts]

import type A from 'foo';
let foo: A;
          
