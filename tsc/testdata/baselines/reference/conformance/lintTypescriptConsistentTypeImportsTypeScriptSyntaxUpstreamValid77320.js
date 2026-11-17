//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamValid77320.ts] ////

//// [input.ts]

import { A, B } from 'foo';
const foo: A = B();
const bar = new A();
        

//// [input.ts]

import { A, B } from 'foo';
const foo: A = B();
const bar = new A();
        
