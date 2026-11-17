//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290162.ts] ////

//// [input.ts]

import type Already1Def from 'foo';
import type { Already1 } from 'foo';
import A, { B } from 'foo';
type T = { b: B };
          

//// [input.ts]

import type Already1Def from 'foo';
import type { Already1 , B } from 'foo';
import A from 'foo';
type T = { b: B };
          
