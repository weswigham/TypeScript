//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid829031.ts] ////

//// [input.ts]

import { A, B } from 'foo';
let foo: A;
let bar: B;
          

//// [input.ts]

import type { A, B } from 'foo';
let foo: A;
let bar: B;
          
