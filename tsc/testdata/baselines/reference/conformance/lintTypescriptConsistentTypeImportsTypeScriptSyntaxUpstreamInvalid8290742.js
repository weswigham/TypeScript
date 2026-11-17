//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290742.ts] ////

//// [input.ts]

import {} from 'foo';
import { Foo, Bar } from 'foo';
function test(foo: Foo) {}
          

//// [input.ts]

import {} from 'foo';
import type { Foo} from 'foo';
import { Bar } from 'foo';
function test(foo: Foo) {}
          
