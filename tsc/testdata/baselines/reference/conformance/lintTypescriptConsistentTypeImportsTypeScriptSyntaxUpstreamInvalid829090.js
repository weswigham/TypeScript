//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid829090.ts] ////

//// [input.ts]

import A, { B } from 'foo';
let foo: A;
let bar: B;
          

//// [input.ts]

import type { B } from 'foo';
import type A from 'foo';
let foo: A;
let bar: B;
          
