//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290731.ts] ////

//// [input.ts]

import 'foo';
import { Foo, Bar } from 'foo';
function test(foo: Foo) {}
          

//// [input.ts]

import 'foo';
import type { Foo} from 'foo';
import { Bar } from 'foo';
function test(foo: Foo) {}
          
