//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290411.ts] ////

//// [input.ts]

import type // comment
DefType from 'foo';

type T = { b: DefType };
          

//// [input.ts]

import // comment
DefType from 'foo';

type T = { b: DefType };
          
