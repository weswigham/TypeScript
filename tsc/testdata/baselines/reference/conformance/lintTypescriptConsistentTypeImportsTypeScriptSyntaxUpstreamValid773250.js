//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid773250.ts] ////

//// [input.ts]

import { B, type C } from 'foo';
import type A from 'baz';
type T = A;
type Z = C;
const b = B;
          

//// [input.ts]

import { B, type C } from 'foo';
import type A from 'baz';
type T = A;
type Z = C;
const b = B;
          
