//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290572.ts] ////

//// [input.ts]

import A, { B, C as D } from 'foo';
type T = B;
type U = D;
type V = A;
          

//// [input.ts]

import {type B, type C as D} from 'foo';
import type A from 'foo';
type T = B;
type U = D;
type V = A;
          
