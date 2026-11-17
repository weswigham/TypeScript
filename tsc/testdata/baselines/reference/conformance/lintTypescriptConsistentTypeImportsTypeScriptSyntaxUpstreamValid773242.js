//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid773242.ts] ////

//// [input.ts]

import { type B } from 'foo';
import type { A } from 'foo';
type T = A;
const b = B;
          

//// [input.ts]

import { type B } from 'foo';
import type { A } from 'foo';
type T = A;
const b = B;
          
