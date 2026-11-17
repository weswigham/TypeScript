//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290632.ts] ////

//// [input.ts]

import { A } from 'foo';
export = {} as A;
          

//// [input.ts]

import { type A } from 'foo';
export = {} as A;
          
