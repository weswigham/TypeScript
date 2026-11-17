//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid773170.ts] ////

//// [input.ts]

import * as Type from 'foo' assert { type: 'json' };
const a: typeof Type = Type;
          

//// [input.ts]

import * as Type from 'foo' assert { type: 'json' };
const a: typeof Type = Type;
          
