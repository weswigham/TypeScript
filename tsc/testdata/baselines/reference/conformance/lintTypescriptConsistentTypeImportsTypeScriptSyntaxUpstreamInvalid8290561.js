//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290561.ts] ////

//// [input.ts]

import A, { B, C } from 'foo';
type T = B;
type U = C;
type V = A;
          

//// [input.ts]

import {type B, type C} from 'foo';
import type A from 'foo';
type T = B;
type U = C;
type V = A;
          
