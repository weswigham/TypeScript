//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290421.ts] ////

//// [input.ts]

import type /*comment*/ { Type } from 'foo';

type T = { c: Type };
          

//// [input.ts]

import /*comment*/ { Type } from 'foo';

type T = { c: Type };
          
