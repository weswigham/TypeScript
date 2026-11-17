//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid5220100.ts] ////

//// [input.ts]

import Foo from 'foo';
export type T = Foo;
        

//// [input.ts]

import type Foo from 'foo';
export type T = Foo;
        
